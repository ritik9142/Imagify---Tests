import logo from './logo.svg';
import logo_icon from './logo_icon.svg';
import facebook_icon from './facebook_icon.svg';
import instagram_icon from './instagram_icon.svg';
import twitter_icon from './twitter_icon.svg';
import star_icon from './star_icon.svg';
import rating_star from './rating_star.svg';
import sample_img_1 from './sample_img_1.png';
import sample_img_2 from './sample_img_2.png';
import profile_img_1 from './profile_img_1.png';
import profile_img_2 from './profile_img_2.png';
import profile_img_3 from './profile_img_3.png';
import step_icon_1 from './step_icon_1.svg';
import step_icon_2 from './step_icon_2.svg';
import step_icon_3 from './step_icon_3.svg';
import user_icon from './user_icon.svg';
import email_icon from './email_icon.svg';
import lock_icon from './lock_icon.svg';
import cross_icon from './cross_icon.svg';
import star_group from './star_group.png';
import credit_star from './credit_star.svg';
import profile_icon from './profile_icon.png';

export const assets = {
  logo,
  logo_icon,
  facebook_icon,
  instagram_icon,
  twitter_icon,
  star_icon,
  rating_star,
  sample_img_1,
  sample_img_2,
  user_icon,
  email_icon,
  lock_icon,
  cross_icon,
  star_group,
  credit_star,
  profile_icon,
};

export const stepsData = [
  {
    title: 'Share Your Idea',
    description: 'Describe your vision in a sentence or two. The more vivid, the better!',
    icon: step_icon_1,
  },
  {
    title: 'AI Works Its Wonders',
    description: 'Sit back as our engine crafts your unique image in seconds—no waiting, just magic.',
    icon: step_icon_2,
  },
  {
    title: 'Download & Share',
    description: 'Download, print, or post your AI-generated art seamlessly. The world’s your canvas!',
    icon: step_icon_3,
  },
];

export const testimonialsData = [
  {
    image: profile_img_1,
    name: 'Shubhangi Wahane',
    role: 'Principal Architect',
    stars: 5,
    text: 'I have been using Remage for nearly two years, primarily for Instagram, and it has been incredibly user-friendly, making my work much easier.',
  },
  {
    image: profile_img_2,
    name: 'Adarsh Sangale',
    role: 'Video Editor',
    stars: 4,
    text: 'I started using Remage AI for my food blog, but now I am hooked for Redbubble and Pinterest too. It is like having a designer in my pocket!',
  },
  {
    image: profile_img_3,
    name: 'Kushagra Sharma',
    role: 'Product Manager',
    stars: 5,
    text: 'Our team collaborates on Remage AI for YouTube thumbnails, blog headers, and Instagram Reels. The cloud storage and shared templates? Game-changer!',
  },
];

export const plans = [
  {
    id: 'Basic',
    price: 99,
    credits: 100,
    desc: 'Best for personal use.',
  },
  {
    id: 'Advanced',
    price: 459,
    credits: 500,
    desc: 'Best for business use.',
  },
  {
    id: 'Business',
    price: 4499,
    credits: 5000,
    desc: 'Best for enterprise use.',
  },
];
