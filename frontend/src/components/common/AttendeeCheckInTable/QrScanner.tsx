import {useEffect, useRef, useState} from 'react';
import * as zbarWasm from '@undecaf/zbar-wasm';
import {useDebouncedValue} from '@mantine/hooks';
import classes from './QrScanner.module.scss';
import {IconBulb, IconBulbOff, IconCameraRotate, IconVolume, IconVolumeOff, IconX} from "@tabler/icons-react";
import {Anchor, Button, Menu} from "@mantine/core";
import {showError} from "../../../utilites/notifications.tsx";
import {t, Trans} from "@lingui/macro";

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
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [isFlashAvailable, setIsFlashAvailable] = useState(false);
    const [isFlashOn, setIsFlashOn] = useState(false);
    const [cameraList, setCameraList] = useState<Camera[]>([]);
    const [currentDeviceId, setCurrentDeviceId] = useState<string>('');
    const [processedAttendeeIds, setProcessedAttendeeIds] = useState<string[]>([]);
    const latestProcessedAttendeeIdsRef = useRef<string[]>([]);

    const [currentAttendeeId, setCurrentAttendeeId] = useState<string | null>(null);
    const [debouncedAttendeeId] = useDebouncedValue(currentAttendeeId, 1000);
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
            const constraints: MediaStreamConstraints = {
                video: {
                    facingMode: 'environment',
                    deviceId: currentDeviceId ? { exact: currentDeviceId } : undefined
                }
            };
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setPermissionGranted(true);
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                
                // Check for flashlight support
                const videoTrack = stream.getVideoTracks()[0];
                const capabilities = videoTrack.getCapabilities();
                setIsFlashAvailable(Boolean(capabilities.torch));
                
                videoRef.current.onloadedmetadata = () => {
                    startScanningLoop();
                };
            }
        } catch (error) {
            setPermissionDenied(true);
            console.error(error);
        }
    };

    const startScanningLoop = () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) return;

        const scan = async () => {
            if (!video.videoWidth || !video.videoHeight) {
                animationRef.current = requestAnimationFrame(scan);
                return;
            }

            // Set canvas dimensions to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Draw video frame to canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            try {
                // Get image data and scan for QR codes
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const symbols = await zbarWasm.scanImageData(imageData);
                
                if (symbols.length > 0) {
                    const qrCode = symbols.find(symbol => symbol.typeName === 'QR-Code');
                    if (qrCode) {
                        const decodedData = qrCode.decode();
                        setCurrentAttendeeId(decodedData);
                    }
                }
            } catch (error) {
                // Ignore scanning errors and continue
                console.debug(error);
            }
            
            // Continue scanning
            animationRef.current = requestAnimationFrame(scan);
        };
        
        // Start the scanning loop
        animationRef.current = requestAnimationFrame(scan);
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

            if (isScanSucceeded || isScanFailed) {
                return;
            }

            if (alreadyScanned) {
                showError(t`You already scanned this ticket`);

                setIsScanFailed(true);
                setInterval(() => setIsScanFailed(false), 500);
                if (isSoundOn && scanErrorAudioRef.current) {
                    scanErrorAudioRef.current.play();
                }

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
                setCurrentAttendeeId(null);

                setIsScanSucceeded(true);
                setInterval(() => setIsScanSucceeded(false), 500);
                if (isSoundOn && scanSuccessAudioRef.current) {
                    scanSuccessAudioRef.current.play();
                }
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
        startScanner().then(() => {
            updateFlashAvailability().catch(console.error);
            getCameraList().catch(console.error);
        });

        return () => {
            if (permissionGranted) {
                stopScanner();
            }
        };
    }, []);

    const handleCameraSelection = (camera: Camera) => async () => {
        stopScanner();
        setCurrentDeviceId(camera.deviceId);
        
        // Small delay before restarting with new camera
        setTimeout(async () => {
            await startScanner();
            updateFlashAvailability().catch(console.error);
        }, 100);
    };

    return (
        <div className={classes.videoContainer}>
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

            <video className={classes.video} ref={videoRef}></video>
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

            <Button onClick={handleFlashToggle} variant={'transparent'} className={classes.flashToggle}>
                {!isFlashAvailable && <IconBulbOff color={'#ffffff95'} size={30}/>}
                {isFlashAvailable && <IconBulb color={isFlashOn ? 'yellow' : '#ffffff95'} size={30}/>}
            </Button>
            <Button onClick={handleSoundToggle} variant={'transparent'} className={classes.soundToggle}>
                {isSoundOn && <IconVolume color={'#ffffff95'} size={30}/>}
                {!isSoundOn && <IconVolumeOff color={'#ffffff95'} size={30}/>}
            </Button>
            <audio ref={scanSuccessAudioRef} src="/sounds/scan-success.wav"/>
            <audio ref={scanErrorAudioRef} src="/sounds/scan-error.wav"/>
            <audio ref={scanInProgressAudioRef} src="/sounds/scan-in-progress.wav"/>
            <Button onClick={handleClose} variant={'transparent'} className={classes.closeButton}>
                <IconX color={'#ffffff95'} size={30}/>
            </Button>
            <Button variant={'transparent'} className={classes.switchCameraButton}>
                <Menu shadow="md" width={200}>
                    <Menu.Target>
                        <IconCameraRotate color={'#ffffff95'} size={30}/>
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
            <div className={`${classes.scannerOverlay} ${isScanSucceeded ? classes.success : ""} ${isScanFailed ? classes.failure : ""} ${isCheckingIn ? classes.checkingIn : ""}`}/>
        </div>
    );
};
