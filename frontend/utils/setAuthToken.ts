import axios from 'axios';

const setAuthToken = (token: string | null) => {
    // Set global baseURL if it's not already set
    if (!axios.defaults.baseURL) {
        axios.defaults.baseURL = 'http://localhost:5000';
    }

    if (token) {
        axios.defaults.headers.common['x-auth-token'] = token;
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete axios.defaults.headers.common['x-auth-token'];
        delete axios.defaults.headers.common['Authorization'];
    }
};

export default setAuthToken;
