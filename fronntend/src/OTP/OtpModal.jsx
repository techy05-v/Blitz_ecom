import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

const OtpModal = ({ email, role = "user", onVerify, onClose }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds cooldown
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef([...Array(6)].map(() => React.createRef()));
  const modalRef = useRef(null);
  const timerRef = useRef(null);

  // Start countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timeLeft]);

  const handleResend = async () => {
    if (timeLeft > 0) {
      toast.info(`Please wait ${timeLeft} seconds before requesting a new OTP`);
      return;
    }
  
    setIsResending(true);
    console.log("Initiating Resend OTP...");
    console.log("Request Payload:", { email, role });
  
    try {
      const response = await fetch('http://localhost:3000/auth/resendotp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          role
        }),
      });
  
      console.log("Response Status Code:", response.status);
      console.log("Raw Response:", response);
  
      let data;
      try {
        // Attempt to parse JSON response
        data = await response.json();
        console.log("Parsed Response Data:", data);
      } catch (jsonError) {
        console.error("Failed to parse JSON response:", jsonError);
        throw new Error("Invalid JSON response from server.");
      }
  
      if (!response.ok) {
        console.error("Server Error Response:", data);
        throw new Error(data.message || 'Failed to resend OTP');
      }
  
      console.log("Resend OTP Successful. Response Message:", data.message);
      toast.success(data.message || 'OTP resent successfully');
      setOtp(['', '', '', '', '', '']); // Clear OTP fields
      inputRefs.current[0].current.focus(); // Focus first input
      setTimeLeft(60); // Reset timer
    } catch (error) {
      console.error("Resend OTP Error:", error.message);
      toast.error(error.message || 'Failed to resend OTP');
    } finally {
      console.log("Resend OTP Request Completed");
      setIsResending(false);
    }
  };
  

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    if (element.value !== '' && index < 5) {
      inputRefs.current[index + 1].current.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (index > 0 && otp[index] === '') {
        inputRefs.current[index - 1].current.focus();
      } else if (otp[index] !== '') {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1].current.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1].current.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
  
    setIsVerifying(true);
    try {
       await onVerify(otpString);
    } catch (error) {
      toast.error(error.message || 'Verification failed. Please try again.');
      console.error('OTP verification error:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-white rounded-lg p-8 max-w-md w-full m-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold mb-4 text-center">Enter OTP</h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          Please enter the verification code sent to {email}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center space-x-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs.current[index]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(e.target, index)}
                onKeyDown={e => handleKeyDown(e, index)}
                className="w-12 h-12 border-2 rounded text-center font-semibold text-xl 
                         border-gray-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                disabled={isVerifying}
              />
            ))}
          </div>

          <button
            type="submit"
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 
                     disabled:bg-purple-400 disabled:cursor-not-allowed"
            disabled={isVerifying || otp.join('').length !== 6}
          >
            {isVerifying ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-2">
            {timeLeft > 0 ? `Resend OTP in ${timeLeft} seconds` : "Didn't receive the code?"}
          </p>
          <button
            onClick={handleResend}
            disabled={timeLeft > 0 || isResending}
            className="text-purple-600 hover:text-purple-800 disabled:text-purple-400 
                     disabled:cursor-not-allowed"
          >
            {isResending ? 'Resending...' : 'Resend OTP'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OtpModal;