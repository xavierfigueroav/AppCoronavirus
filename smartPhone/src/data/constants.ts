
const API_ENDPOINT = 'http://ec2-3-17-143-36.us-east-2.compute.amazonaws.com:5000';
export const API_KEY = '491c5713-dd3e-4dda-adda-e36a95d7af77';
export const OWNER_ORG = '0daa04ac-4b43-4316-bbf0-537cd5b881ac';

export const CREATE_DATASET_URL = `${API_ENDPOINT}/api/3/action/package_create`;
export const CREATE_REGISTRY_URL = `${API_ENDPOINT}/api/integracion/table/insert`;
export const READ_REGISTRY_URL = `${API_ENDPOINT}/api/integracion/table/read`;
export const UPDATE_REGISTRY_URL = `${API_ENDPOINT}/api/integracion/table/update`;
export const DELETE_REGISTRY_URL = `${API_ENDPOINT}/api/integracion/table/delete`;

const DEMOGRAPHY_API = 'http://116.203.202.75';
export const GET_AREA_URL = `${DEMOGRAPHY_API}/area`;

const EMAIL_API_ENDPOINT = 'http://192.168.100.241:8000';
export const SEND_EMAIL_URL = `${EMAIL_API_ENDPOINT}/purevid/enviar_correo`;
