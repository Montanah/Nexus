const generateOTP = () => {
    const length = 6;
    const characters = '0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        otp += characters.charAt(randomIndex);
    }
    return otp;
}

module.exports = { generateOTP }