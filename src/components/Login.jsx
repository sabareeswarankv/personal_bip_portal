import React, { useState, useEffect } from 'react';

// Decodes Google's identity token (JWT) on the client side without dependencies
const decodeJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("JWT decoding failed", e);
    return null;
  }
};

const extractNameFromEmail = (emailStr) => {
  if (!emailStr) return "Student";
  const parts = emailStr.split('@');
  const namePart = parts[0];
  return namePart
    .split(/[._-+]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleManualLogin = (e) => {
    e.preventDefault();
    const resolvedName = extractNameFromEmail(email || "student@personalps.com");
    onLogin({
      name: resolvedName,
      email: email || "student@personalps.com",
      avatarLetter: resolvedName.charAt(0).toUpperCase() || "S"
    });
  };

  const handleCredentialResponse = (response) => {
    const payload = decodeJwt(response.credential);
    if (payload) {
      const resolvedName = payload.name || extractNameFromEmail(payload.email);
      onLogin({
        name: resolvedName,
        email: payload.email,
        avatarUrl: payload.picture, // Google profile image URL
        avatarLetter: (payload.given_name || resolvedName || "S")[0].toUpperCase()
      });
    }
  };

  useEffect(() => {
    // Load Google Identity Services SDK dynamically
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: "999983962682-glgplc0v91qeveebjbg1paca5ul9cnl7.apps.googleusercontent.com",
          callback: handleCredentialResponse
        });

        // Render the official Google Sign-In button
        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          { 
            theme: "outline", 
            size: "large", 
            width: "350", 
            text: "signin_with",
            shape: "rectangular"
          }
        );
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F1F3F9] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Login Card */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 max-w-md w-full p-8 space-y-6">
        
        {/* Logo and Head Title */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-10 h-10 text-gray-800" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 3.31 1.62 6.24 4.12 8.06C6.7 19.3 8 17.8 8 16.5c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5c0 1.3 1.3 2.8 1.88 3.56C19.89 18.42 22 15.45 22 12c0-5.52-4.48-10-10-10zm-1.5 8c-.83 0-1.5-.67-1.5-1.5S9.67 7 10.5 7s1.5.67 1.5 1.5S11.33 10 10.5 10zm4 3c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
            </svg>
            <span className="text-xl font-bold text-gray-800 tracking-tight">Personal PS Assessment</span>
          </div>
          
          <h2 className="text-[#8B5CF6] text-xl font-bold mt-2">Hi, Welcome Back!</h2>
        </div>

        {/* Inputs Form */}
        <form onSubmit={handleManualLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Username</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full bg-[#EEF2F6] border-none rounded-lg py-3 px-4 text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:bg-white outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full bg-[#EEF2F6] border-none rounded-lg py-3 px-4 text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:bg-white outline-none transition"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold py-3 rounded-lg transition shadow-md shadow-violet-500/10 text-sm"
          >
            Login
          </button>
        </form>

        {/* OR separator */}
        <div className="flex items-center justify-center my-4">
          <span className="h-px bg-gray-200 flex-1"></span>
          <span className="text-xs text-gray-400 font-bold px-3">Or</span>
          <span className="h-px bg-gray-200 flex-1"></span>
        </div>

        {/* Google OAuth Button Container */}
        <div className="w-full flex justify-center py-2">
          <div id="google-signin-btn" className="w-full max-w-xs flex justify-center"></div>
        </div>

      </div>
    </div>
  );
}
