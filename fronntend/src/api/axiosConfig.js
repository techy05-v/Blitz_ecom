import axios from "axios";
import {
	attachRequestInterceptor,
	attachResponseInterceptor,
} from "./setupInterceptors";

const baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:3000";

const axiosInstance = axios.create({
	baseURL,
	headers: {
		"Content-Type": "application/json",
	},
	withCredentials: true,
});

const axiosMultipartInstance = axios.create({
	baseURL,
	headers: {
		"Content-Type": "multipart/form-data",
	},
	withCredentials: true,
});

const refreshEndpoint = "/auth/refreshtoken";

attachRequestInterceptor(axiosInstance);
attachRequestInterceptor(axiosMultipartInstance);

attachResponseInterceptor(axiosInstance, refreshEndpoint);
attachResponseInterceptor(axiosMultipartInstance, refreshEndpoint);

export { axiosInstance, axiosMultipartInstance };