import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const [values, setValues] = useState({
        email: '',
        password: '',
    });

    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        axios.post('http://localhost:8081/login', values)
            .then(res => {
                if (res.data.message === "Đăng nhập thành công") {
                    localStorage.setItem('ID_user', res.data.userData.ID); // Thêm dòng này để lưu ID_user vào localStorage
                    const role = values.email === 'admin1@gmail.com' ? 'admin' : 'user';
                    if (role === 'admin') {
                        navigate('/Dashbroad');
                    } else if (role === 'user') {
                        navigate('/home');
                    }
                } else {
                    alert(res.data); // Sửa thành res.data
                }
            })
            .catch(err => console.log(err));
    };


    return (
        <div className="d-flex justify-content-center align-items-center bg-primary vh-100">
            <div className="bg-white p-3 rounded w-25">
                <h2>Đăng Nhập</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="email">Email:</label>
                        <input type="email" id="email" name="email" placeholder="Nhập email của bạn"
                            onChange={e => setValues({ ...values, email: e.target.value })} className='form-control rounded-0' />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="password">Mật khẩu:</label>
                        <input type="password" id="password" name="password" placeholder="Nhập mật khẩu của bạn"
                            onChange={e => setValues({ ...values, password: e.target.value })} className='form-control rounded-0' />
                    </div>
                    <button type='submit' className='btn btn-success w-100 rounded-0'>Sign in</button>
                    <p>You are agree to aour terms and policies</p>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
