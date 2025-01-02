import Cookies from 'js-cookie';

const storeAccessToken = (role, token) => {
  try {
    Cookies.set(`${role}_access_token`, token, {
      expires: 1, // 1 day
      secure: true,
      sameSite: 'strict'
    });
    return true;
  } catch (error) {
    console.error('Error storing access token:', error);
    return false;
  }
};

export default storeAccessToken;