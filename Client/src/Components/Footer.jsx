import React from 'react';
import { assets } from '../assets/assets';

const Footer = () => {
  // Array of policy links with names and URLs
  const policyLinks = [
    { name: 'Terms and Conditions', url: 'https://docs.google.com/document/d/e/2PACX-1vT0ns95TSRrpka5SRAGv44P3stLuoNLKTQ3oIEQv1bp9Czz5SmVOWxqBbXMzTsr-p8dPoIeru7zKC_l/pub' },
    { name: 'Privacy Policy', url: 'https://docs.google.com/document/d/e/2PACX-1vSUTOjs3IKrP6BfMGbKxnGEU1MIRRhA1cfNsVKMGqxsTQOaaNWc6B-Hcu4xFtdZZPZPew2KGATDzuvY/pub' },
    { name: 'Cancellations and Refunds', url: 'https://docs.google.com/document/d/e/2PACX-1vQ1-ZZiUH0m_xjLsD8jUkS-aMGIg4VPRnwvS2vo5--dbcXRtqka-oM_Y2aC9PpA2uCfmrkUjvbRrEwu/pub' },
  ]

  return (
    <div className="mt-20">
      <div className="flex flex-col md:flex-row items-center md:justify-between py-3">
        {/* Logo */}
        <img src={assets.logo} width={150} alt="Krutishu Logo" />

        {/* Policy Links and Copyright */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap gap-4">
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
        <div className="flex flex-wrap gap-2.5">
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
