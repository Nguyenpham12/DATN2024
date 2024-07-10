import React, { useState, useEffect, useRef } from 'react';
import UserNavbar from '../Navbar/UserNavbar';
import axios from 'axios';
import Webcam from 'react-webcam';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import styles from './UploadPhotoPage.module.css';
import DefaultAvatar from '../../assets/avatarinUploadpage.png';
import * as faceapi from 'face-api.js'; // Import face-api.js

const UploadPhotoPage = () => {
    const [formData, setFormData] = useState({
        username: '',
        image: '',
        id_user: ''
    });
    const [error, setError] = useState(null);
    const [cameraActive, setCameraActive] = useState(false); // State để theo dõi trạng thái của camera
    const [capturedImage, setCapturedImage] = useState(null);
    const [userImages, setUserImages] = useState([]);
    const [faceDetectionResult, setFaceDetectionResult] = useState(null); // State để lưu kết quả nhận diện khuôn mặt
    const webcamRef = useRef(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const userID = localStorage.getItem('ID_user');

            if (!userID) {
                setError("Không tìm thấy User ID trong localStorage");
                return;
            }

            try {
                const res = await axios.get(`http://localhost:8081/userInfo4AddImgUserSite/${userID}`);
                const userInfo = res.data;
                setFormData({
                    username: userInfo.FullName,
                    id_user: userInfo.ID
                });

                fetchUserImages(userID);
            } catch (err) {
                setError(err.response ? err.response.data : "Lỗi khi lấy dữ liệu người dùng");
            }
        };

        fetchUserData();
    }, []);

    useEffect(() => {
        const loadModels = async () => {
            // Load các model cần thiết từ face-api.js
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
            ]);
            console.log("Models loaded");
        };

        loadModels(); // Gọi hàm để tải model khi component mount
    }, []);

    const fetchUserImages = async (userID) => {
        try {
            const res = await axios.get(`http://localhost:8081/userImages/${userID}`);
            setUserImages(res.data);
        } catch (err) {
            console.error("Error fetching user images:", err);
            setError(err.response ? err.response.data : "Lỗi khi lấy danh sách ảnh của người dùng");
        }
    };

    const handleChange = (e) => {
        if (e.target.name === 'image') {
            setFormData({ ...formData, [e.target.name]: e.target.files[0] });
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const userID = localStorage.getItem('ID_user');

        const data = new FormData();
        data.append('username', formData.username);
        data.append('image', formData.image);
        data.append('id_user', formData.id_user);

        axios.post(`http://localhost:8081/ImgUserAddUserSite/${userID}`, data)
            .then(res => {
                fetchUserImages(userID);
            })
            .catch(err => {
                setError(err.response ? err.response.data : "Lỗi khi upload hình ảnh");
            });
    };

    const handleCaptureClick = () => {
        setCameraActive(true); // Bật camera khi nhấn vào nút "Chụp ảnh"
    };

    const handleCapturePhoto = () => {
        const imageSrc = webcamRef.current.getScreenshot();
        setCapturedImage(imageSrc);
        setCameraActive(false); // Tắt camera sau khi chụp ảnh

        fetch(imageSrc)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], 'captured.png', { type: 'image/png' });
                setFormData({ ...formData, image: file });
            });
    };

    const handleSaveCapturedImage = () => {
        const userID = localStorage.getItem('ID_user');

        const data = new FormData();
        data.append('username', formData.username);
        data.append('image', formData.image);
        data.append('id_user', formData.id_user);

        axios.post(`http://localhost:8081/ImgUserAddUserSite/${userID}`, data)
            .then(res => {
                setCapturedImage(null);
                fetchUserImages(userID);
            })
            .catch(err => {
                setError(err.response ? err.response.data : "Lỗi khi upload hình ảnh");
            });
    };

    const handleDeleteImage = async (imageID) => {
        try {
            const userID = localStorage.getItem('ID_user');
            await axios.delete(`http://localhost:8081/deleteUserImage/${userID}/${imageID}`);
            fetchUserImages(userID);
        } catch (err) {
            console.error("Error deleting image:", err);
            setError(err.response ? err.response.data : "Lỗi khi xóa hình ảnh");
        }
    };

    useEffect(() => {
        // Hàm để nhận diện khuôn mặt trong video từ webcam
        const detectFaceInVideo = async () => {
            if (webcamRef.current && cameraActive) { // Sử dụng cameraActive thay vì showCamera
                const video = webcamRef.current.video;
                const result = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();

                if (result) {
                    const detectionPercentage = Math.round(result.detection._score * 100); // Tính phần trăm nhận diện
                    setFaceDetectionResult(detectionPercentage);
                } else {
                    setFaceDetectionResult(null);
                }
            }
        };

        const interval = setInterval(() => {
            detectFaceInVideo();
        }, 1000); // Thực hiện nhận diện mỗi giây

        return () => clearInterval(interval); // Clean up khi component unmount
    }, [cameraActive]);

    const renderUserImages = () => {
        if (userImages.length === 0) {
            return <p>Bạn chưa có ảnh nào.</p>;
        } else if (userImages.length > 4) {
            return (
                <Slider {...sliderSettings}>
                    {userImages.map(image => (
                        <div key={image.ID} className={styles.imageItem}>
                            <img src={`http://localhost:8081/Images/${image.Image}`} alt={image.UserName} className={styles.userImage} />
                            <button type="button" onClick={() => handleDeleteImage(image.ID)} className={styles.deleteButton}>X</button>
                        </div>
                    ))}
                </Slider>
            );
        } else {
            return (
                <div className={styles.imageGrid}>
                    {userImages.map(image => (
                        <div key={image.ID} className={styles.imageItem}>
                            <img src={`http://localhost:8081/Images/${image.Image}`} alt={image.UserName} className={styles.userImage} />
                            <button type="button" onClick={() => handleDeleteImage(image.ID)} className={styles.deleteButton}>X</button>
                        </div>
                    ))}
                </div>
            );
        }
    };

    const sliderSettings = {
        dots: true,
        speed: 500,
        slidesToShow: 4,
        slidesToScroll: 4,
        nextArrow: <SampleNextArrow />,
        prevArrow: <SamplePrevArrow />
    };

    function SampleNextArrow(props) {
        const { className, style, onClick } = props;
        return (
            <div
                className={`${className} ${styles.customArrow}`}
                style={{ ...style, display: 'block' }}
                onClick={onClick}
            />
        );
    }

    function SamplePrevArrow(props) {
        const { className, style, onClick } = props;
        return (
            <div
                className={`${className} ${styles.customArrow}`}
                style={{ ...style, display: 'block' }}
                onClick={onClick}
            />
        );
    }

    return (
        <div>
            <div className={styles.profilePage}>
                <div className={styles.profileHeader}>
                    <div className={styles.avatarContainer}>
                        <div className={styles.placeholderAvatar}><img src={DefaultAvatar} alt="Default Avatar" className={styles.Avatar} /></div>
                    </div>
                    <div className={styles.userInfo}>
                        <h2 className={styles.username}>{formData.username}</h2>
                        <p className={styles.userId}>ID: {formData.id_user}</p>
                    </div>
                </div>
                <div className={styles.uploadSection}>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>Tải lên ảnh mới</h2>
                        </div>
                        <div className={styles.cardBody}>
                            <form onSubmit={handleSubmit}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="image" className={styles.formLabel}>Hình ảnh</label>
                                    <input type="file" id="image" name="image" onChange={handleChange} className={styles.formControl} accept="*" required />
                                    <button type="button" onClick={handleCaptureClick} className={styles.captureButton}>Chụp ảnh</button>
                                </div>
                                <button type="submit" className={styles.submitButton}>Tải lên</button>
                            </form>
                            {error && <div className={styles.alert}>{typeof error === 'string' ? error : JSON.stringify(error)}</div>}
                        </div>
                    </div>
                </div>

                {cameraActive && (
                    <div className={styles.modalOverlay}>
                        <div className={styles.modalContent}>
                            <span onClick={() => setCameraActive(false)} className={styles.closeIcon}>X</span>
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/png"
                                className={styles.webcam}
                            />
                            {/* Phần hiển thị phần trăm nhận diện */}
                            {faceDetectionResult !== null && (
                                <div className={styles.faceDetection}>
                                    Phần trăm nhận diện khuôn mặt: {faceDetectionResult}%
                                </div>
                            )}
                            <button onClick={handleCapturePhoto} className={styles.captureButton}>Chụp</button>
                        </div>
                    </div>
                )}
                {capturedImage && (
                    <div className={styles.modalOverlay}>
                        <div className={styles.modalContent}>
                            <img src={capturedImage} alt="Captured" className={styles.capturedImage} />
                            <button onClick={handleSaveCapturedImage} className={styles.saveButton}>Lưu</button>
                            <button onClick={() => setCapturedImage(null)} className={styles.closeButton}>Đóng</button>
                        </div>
                    </div>
                )}

                <div className={styles.userImages}>
                    <h2>Danh sách hình ảnh</h2>
                    {renderUserImages()}
                </div>
            </div>
        </div>
    );
};

export default UploadPhotoPage;
