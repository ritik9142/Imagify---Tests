import React from 'react';
import { assets } from '../assets/assets';

const Footer = () => {
  // Array of policy links with names and URLs
  const policyLinks = [
    { name: 'Terms and Conditions', url: 'https://merchant.razorpay.com/policy/Q3vf8fuC7bRjeV/terms' },
    { name: 'Privacy Policy', url: 'https://merchant.razorpay.com/policy/Q3vf8fuC7bRjeV/privacy' },
    { name: 'Cancellations and Refunds', url: 'https://merchant.razorpay.com/policy/Q3vf8fuC7bRjeV/refund' },
    { name: 'Shipping Policy', url: 'https://merchant.razorpay.com/policy/Q3vf8fuC7bRjeV/shipping' },
    { name: 'Contact Us', url: 'https://merchant.razorpay.com/policy/Q3vf8fuC7bRjeV/contact_us' },
  ];

  return (
    <div className="mt-20">
      <div className="flex items-center justify-between py-3">
        {/* Logo */}
        <img src={assets.logo} width={150} alt="Krutishu Logo" />

        {/* Policy Links and Copyright */}
        <div className="flex items-center gap-4">
          <div className="flex gap-4">
            {policyLinks.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-small text-gray-500 hover:text-gray-700"
              >
                {link.name}
              </a>
            ))}
          </div>
          <p className="text-small text-gray-500">Copyright @Krutishu | All rights reserved.</p>
        </div>

        {/* Social Media Icons */}
        <div className="flex gap-2.5">
          <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">
            <img src={assets.facebook_icon} alt="Facebook" width={35} />
          </a>
          <a href="https://www.instagram.com/krutishu.in/" target="_blank" rel="noopener noreferrer">
            <img src={assets.instagram_icon} alt="Instagram" width={35} />
          </a>
          <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer">
            <img src={assets.twitter_icon} alt="Twitter" width={35} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Footer;
