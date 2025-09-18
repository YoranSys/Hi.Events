import { useEffect, useRef, useState } from 'react';
import * as zbarWasm from '@undecaf/zbar-wasm';
import { useDebouncedValue } from '@mantine/hooks';
import classes from './QrScanner.module.scss';
import { IconBulb, IconBulbOff, IconCameraRotate, IconVolume, IconVolumeOff, IconX } from "@tabler/icons-react";
import { Anchor, Button, Menu } from "@mantine/core";
import { showError } from "../../../utilites/notifications.tsx";
import { t, Trans } from "@lingui/macro";

interface QRScannerComponentProps {
    onAttendeeScanned: (attendeePublicId: string) => void;
    onClose: () => void;
}

interface Camera {
    deviceId: string;
    label: string;
}

export const QRScannerComponent = (props: QRScannerComponentProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationRef = useRef<number | null>(null);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [cameraInitialized, setCameraInitialized] = useState(false);
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [isFlashAvailable, setIsFlashAvailable] = useState(false);
    const [isFlashOn, setIsFlashOn] = useState(false);
    const [cameraList, setCameraList] = useState<Camera[]>([]);
    const [currentDeviceId, setCurrentDeviceId] = useState<string>('');
    const [processedAttendeeIds, setProcessedAttendeeIds] = useState<string[]>([]);
    const latestProcessedAttendeeIdsRef = useRef<string[]>([]);

    const [currentAttendeeId, setCurrentAttendeeId] = useState<string | null>(null);
    const [debouncedAttendeeId] = useDebouncedValue(currentAttendeeId, 100); // Reduced to 100ms for faster scanning
    const [isScanFailed, setIsScanFailed] = useState(false);
    const [isScanSucceeded, setIsScanSucceeded] = useState(false);

    const scanSuccessAudioRef = useRef<HTMLAudioElement | null>(null);
    const scanErrorAudioRef = useRef<HTMLAudioElement | null>(null);
    const scanInProgressAudioRef = useRef<HTMLAudioElement | null>(null);

    const [isSoundOn, setIsSoundOn] = useState(() => {
        const storedIsSoundOn = localStorage.getItem("qrScannerSoundOn");
        return storedIsSoundOn === null ? true : JSON.parse(storedIsSoundOn);
    });

    useEffect(() => {
        localStorage.setItem("qrScannerSoundOn", JSON.stringify(isSoundOn));
    }, [isSoundOn]);

    useEffect(() => {
        latestProcessedAttendeeIdsRef.current = processedAttendeeIds;
    }, [processedAttendeeIds]);

    const startScanner = async () => {
        try {
            // Check if navigator.mediaDevices is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera API not supported');
            }

            const constraints: MediaStreamConstraints = {
                video: {
                    facingMode: 'environment',
                    deviceId: currentDeviceId ? { exact: currentDeviceId } : undefined,
                    width: { min: 640, ideal: 1280, max: 1920 },
                    height: { min: 480, ideal: 720, max: 1080 }
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setPermissionGranted(true);
            setPermissionDenied(false);
            setCameraInitialized(true);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;

                // Check for flashlight support
                const videoTrack = stream.getVideoTracks()[0];
                const capabilities = videoTrack.getCapabilities();
                setIsFlashAvailable(Boolean(capabilities.torch));

                // Wait for video metadata and ensure it's playing
                await new Promise<void>((resolve, reject) => {
                    if (!videoRef.current) {
                        reject(new Error('Video element not found'));
                        return;
                    }

                    const video = videoRef.current;

                    const onLoadedMetadata = () => {
                        video.removeEventListener('loadedmetadata', onLoadedMetadata);
                        video.removeEventListener('error', onError);

                        // Ensure video plays
                        video.play().then(() => {
                            resolve();
                        }).catch(reject);
                    };

                    const onError = (event: Event) => {
                        video.removeEventListener('loadedmetadata', onLoadedMetadata);
                        video.removeEventListener('error', onError);
                        reject(new Error('Video loading failed'));
                    };

                    video.addEventListener('loadedmetadata', onLoadedMetadata);
                    video.addEventListener('error', onError);

                    // If metadata is already loaded
                    if (video.readyState >= 1) {
                        onLoadedMetadata();
                    }
                });

                startScanningLoop();
                updateFlashAvailability().catch(console.error);
            }
        } catch (error: any) {
            setPermissionGranted(false);
            setPermissionDenied(true);
            setCameraInitialized(false);
            console.error('Camera initialization failed:', error);

            // Log specific error types for debugging
            if (error.name === 'NotAllowedError') {
                console.error('Camera permission denied by user');
            } else if (error.name === 'NotFoundError') {
                console.error('No camera device found');
            } else if (error.name === 'NotSupportedError') {
                console.error('Camera not supported');
            } else if (error.name === 'SecurityError') {
                console.error('Camera access blocked by security policy');
            }
        }
    };

    const startScanningLoop = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) return;

        let isScanning = true;
        let lastScanTime = 0;
        const scanInterval = 150; // Scan every 150ms (6.7 times per second) for rapid ticket scanning

        const scan = async (currentTime: number) => {
            if (!isScanning) return;

            // Throttle scanning to reduce CPU usage
            if (currentTime - lastScanTime < scanInterval) {
                animationRef.current = requestAnimationFrame(scan);
                return;
            }

            lastScanTime = currentTime;

            if (!video.videoWidth || !video.videoHeight || video.paused || video.ended) {
                animationRef.current = requestAnimationFrame(scan);
                return;
            }

            try {
                // Set canvas dimensions to match video
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                // Draw video frame to canvas
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Get image data and scan for QR codes
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const symbols = await zbarWasm.scanImageData(imageData);

                if (symbols.length > 0) {
                    console.log('Symbols found:', symbols.map((s: any) => ({
                        typeName: s.typeName,
                        hasData: !!s.data,
                        hasDecode: !!s.decode,
                        keys: Object.keys(s)
                    })));

                    // Find QR code symbol - check all symbols for QR codes
                    for (const symbol of symbols) {
                        console.log('Processing symbol:', symbol.typeName || symbol.type);
                        if (symbol.typeName === 'ZBAR_QRCODE' || symbol.type === 'ZBAR_QRCODE' ||
                            symbol.typeName === 'QR-Code' || symbol.type === 'QR-Code') {
                            // Try different ways to get the decoded data based on zbar-wasm API
                            let decodedData = null;

                            if (typeof symbol.decode === 'function') {
                                decodedData = symbol.decode();
                            } else if (symbol.data) {
                                decodedData = symbol.data;
                            } else if (symbol.rawData) {
                                decodedData = symbol.rawData;
                            }

                            console.log('QR Symbol processed:', { typeName: symbol.typeName, decodedData });

                            if (decodedData) {
                                setCurrentAttendeeId(decodedData);
                                break;
                            }
                        }
                    }
                }
            } catch (error) {
                // Ignore scanning errors and continue
                console.debug('Scan error:', error);
            }

            // Continue scanning if still active
            if (isScanning) {
                animationRef.current = requestAnimationFrame(scan);
            }
        };

        // Start the scanning loop
        animationRef.current = requestAnimationFrame(scan);

        // Store the stop function for cleanup
        return () => {
            isScanning = false;
        };
    };

    const stopScanner = () => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const getCameraList = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices
                .filter(device => device.kind === 'videoinput')
                .map(device => ({
                    deviceId: device.deviceId,
                    label: device.label || `Camera ${device.deviceId.slice(0, 8)}`
                }));
            setCameraList(videoDevices);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (debouncedAttendeeId) {
            const latestProcessedAttendeeIds = latestProcessedAttendeeIdsRef.current;
            const alreadyScanned = latestProcessedAttendeeIds.includes(debouncedAttendeeId);

            if (alreadyScanned) {
                showError(t`You already scanned this ticket`);

                setIsScanFailed(true);
                setTimeout(() => setIsScanFailed(false), 500);
                if (isSoundOn && scanErrorAudioRef.current) {
                    scanErrorAudioRef.current.play();
                }

                // Clear the current attendee ID to allow new scans
                setCurrentAttendeeId(null);
                return;
            }

            if (!isCheckingIn && !alreadyScanned) {
                setIsCheckingIn(true);
                if (isSoundOn && scanInProgressAudioRef.current) {
                    scanInProgressAudioRef.current.play();
                }

                props.onAttendeeScanned(debouncedAttendeeId);
                setIsCheckingIn(false);
                setProcessedAttendeeIds(prevIds => [...prevIds, debouncedAttendeeId]);

                setIsScanSucceeded(true);
                setTimeout(() => setIsScanSucceeded(false), 500);
                if (isSoundOn && scanSuccessAudioRef.current) {
                    scanSuccessAudioRef.current.play();
                }

                // Clear the current attendee ID to allow new scans
                setCurrentAttendeeId(null);
            }
        }
    }, [debouncedAttendeeId]);

    const handleClose = () => {
        stopScanner();
        props.onClose();
    };

    const handleFlashToggle = async () => {
        if (!isFlashAvailable) {
            showError(t`Flash is not available on this device`);
            return;
        }

        if (streamRef.current) {
            const videoTrack = streamRef.current.getVideoTracks()[0];
            try {
                await videoTrack.applyConstraints({
                    advanced: [{ torch: !isFlashOn }]
                } as MediaStreamConstraints);
                setIsFlashOn(!isFlashOn);
            } catch (error) {
                console.error(error);
                showError(t`Failed to toggle flash`);
            }
        }
    };

    const handleSoundToggle = () => {
        setIsSoundOn(!isSoundOn);
    };

    const requestPermission = async () => {
        setPermissionDenied(false);
        setCameraInitialized(false);
        await startScanner();
    };

    const updateFlashAvailability = async () => {
        if (streamRef.current) {
            const videoTrack = streamRef.current.getVideoTracks()[0];
            const capabilities = videoTrack.getCapabilities();
            setIsFlashAvailable(Boolean(capabilities.torch));
        }
    };

    useEffect(() => {
        let isMounted = true;

        // Don't auto-start scanner to avoid permission issues on mobile browsers like Brave
        // Instead, wait for explicit user interaction
        getCameraList().catch(console.error);

        return () => {
            isMounted = false;
            stopScanner();
        };
    }, []);

    const handleCameraSelection = (camera: Camera) => async () => {
        if (currentDeviceId === camera.deviceId) return; // Don't switch if already using this camera

        stopScanner();
        setCurrentDeviceId(camera.deviceId);

        // Small delay before restarting with new camera
        setTimeout(async () => {
            try {
                await startScanner();
                updateFlashAvailability().catch(console.error);
            } catch (error) {
                console.error('Failed to switch camera:', error);
                showError(t`Failed to switch camera`);
            }
        }, 200);
    };

    return (
        <div className={classes.videoContainer}>
            {!cameraInitialized && !permissionDenied && (
                <div className={classes.permissionMessage}>
                    <Trans>
                        Tap the button below to start the camera and begin scanning QR codes.
                    </Trans>
                    <div>
                        <Button color={'green'} mt={20} onClick={requestPermission} variant={'filled'}>
                            {t`Start Camera`}
                        </Button>
                    </div>
                </div>
            )}

            {permissionDenied && (
                <div className={classes.permissionMessage}>
                    <Trans>
                        Camera permission was denied. <Anchor onClick={requestPermission}>Request
                            Permission</Anchor> again,
                        or if this doesn't work,
                        you will need to <Anchor target={'_blank'}
                            href={'https://support.onemob.com/hc/en-us/articles/360037342154-How-do-I-grant-permission-for-Camera-and-Microphone-in-my-web-browser-'}>grant
                            this page</Anchor> access to your camera in your browser settings.
                    </Trans>

                    <div>
                        <Button color={'green'} mt={20} onClick={handleClose} variant={'filled'}>
                            {t`Close`}
                        </Button>
                    </div>
                </div>
            )}

            <video
                className={classes.video}
                ref={videoRef}
                autoPlay
                playsInline
                muted
            ></video>
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

            <Button onClick={handleFlashToggle} variant={'transparent'} className={classes.flashToggle}>
                {!isFlashAvailable && <IconBulbOff color={'#ffffff95'} size={30} />}
                {isFlashAvailable && <IconBulb color={isFlashOn ? 'yellow' : '#ffffff95'} size={30} />}
            </Button>
            <Button onClick={handleSoundToggle} variant={'transparent'} className={classes.soundToggle}>
                {isSoundOn && <IconVolume color={'#ffffff95'} size={30} />}
                {!isSoundOn && <IconVolumeOff color={'#ffffff95'} size={30} />}
            </Button>
            <audio ref={scanSuccessAudioRef} src="/sounds/scan-success.wav" />
            <audio ref={scanErrorAudioRef} src="/sounds/scan-error.wav" />
            <audio ref={scanInProgressAudioRef} src="/sounds/scan-in-progress.wav" />
            <Button onClick={handleClose} variant={'transparent'} className={classes.closeButton}>
                <IconX color={'#ffffff95'} size={30} />
            </Button>
            <Button variant={'transparent'} className={classes.switchCameraButton}>
                <Menu shadow="md" width={200}>
                    <Menu.Target>
                        <IconCameraRotate color={'#ffffff95'} size={30} />
                    </Menu.Target>
                    <Menu.Dropdown>
                        <Menu.Label>{t`Select Camera`}</Menu.Label>
                        {cameraList.map((camera, index) => (
                            <Menu.Item key={index} onClick={handleCameraSelection(camera)}>
                                {camera.label}
                            </Menu.Item>
                        ))}
                    </Menu.Dropdown>
                </Menu>
            </Button>
            <div className={`${classes.scannerOverlay} ${isScanSucceeded ? classes.success : ""} ${isScanFailed ? classes.failure : ""} ${isCheckingIn ? classes.checkingIn : ""}`} />
        </div>
    );
};
