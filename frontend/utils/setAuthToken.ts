import axios from 'axios';

const setAuthToken = (token: string | null) => {
    // Set global baseURL if it's not already set
    if (!axios.defaults.baseURL) {
        // Use the root URL (stripping /api if present in the environment variable)
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        axios.defaults.baseURL = apiUrl.replace(/\/api$/, '');
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
