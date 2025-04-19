// src/Pages/Result.jsx
import React, { useContext, useState, useEffect } from 'react';
import { assets } from '../assets/assets';
import { motion } from 'framer-motion';
import { AppContext } from '../Context/AppContext';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import { Autoplay, Navigation } from 'swiper/modules';
import LiquidSlider from '../Components/LiquidSlider';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Result = () => {
  // States
  const [image, setImage] = useState(assets.sample_img_1);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [i2iPrompt, setI2iPrompt] = useState('');
  const [mode, setMode] = useState('text-to-image');
  const [inputImage, setInputImage] = useState(null);
  const [styleImage, setStyleImage] = useState(null);
  const [param1, setParam1] = useState(20); // Depth Strength
  const [param2, setParam2] = useState(0.5); // Style Strength
  const [activeIndex, setActiveIndex] = useState(0);
  const [inputImageUrl, setInputImageUrl] = useState(null);
  const [styleImageUrl, setStyleImageUrl] = useState(null);

  // Context functions
  const { generateImage: generateTextToImage, generateImageToImage } = useContext(AppContext);

  // Navigation hook
  const navigate = useNavigate();

  // Example images for Text-to-Image
  const exampleImages = [
    { image: assets.example1, prompt: 'Create a whimsical illustration depicting a cozy living room scene on a lazy weekend. The focal point is a plush, oversized couch adorned with colorful throw pillows, positioned in front of a large window with sunlight streaming in, casting warm golden rays. A fluffy cat lounges on the couch while a half-open book and a steaming cup of tea rest on a cluttered coffee table.' },
    { image: assets.example2, prompt: 'In a dystopian cyberpunk landscape, glitching avatars flicker erratically, their pixelated forms shimmering in hues of electric blue and vibrant magenta against the backdrop of forgotten ruins. The remnants of a once-thriving metropolis create a surreal, dreamlike tableau.' },
    { image: assets.example3, prompt: "Looking at camera medieval romanticism neon glowing contoured filigree detailed marvel transparent venom character layered rough textured comic style artistic masterpiece portrait many tiny sketches in one art cinematic magic art nouveau collage by Mucha Klimt postcard old photo young tender rococo lady black and white venom creature, venom face dynamic intricated pose made of swirling colors on cracked liquid paper fluid markers sketch splatter watercolor close up dynamic color floral blossoming patterns abstract expressionism alcohol ink drawing double exposure book illustration swirling spiral diptych two parts in one art landscape ink cinematic portrait on cracked old antique burned paper, transparent earth panorama poster ultra detailed complex print transparent illustration detailed perfect face city lights, city panorama red sunset dynamic movement Craola Kuindzhi Dan Mumford Andy Kehoe expressive brushstrokes mixed with wash masterpiece, transparence intricated lighting, dynamic shadow play sparks, high deepness cinematic foggy with 'Krutishu' Sign Board " },
    { image: assets.example4, prompt: "A bohemian-style female travel blogger with sun-kissed skin and messy beach waves, sitting on a tropical beach at sunset. She wears a flowy white sundress and holds a weathered postcard with 'Wanderlust Krutishu' written on it. Golden hour lighting bathes the scene in warm tones." },
    { image: assets.example5, prompt: 'Portrait | wide angle shot of eyes off to one side of frame, lucid dream-like 3d model of owl, game asset, blender, looking off in distance ::8 style | glowing ::8 background | forest, vivid neon wonderland, particles, blue, green, orange ::7 parameters | rule of thirds, golden ratio, assymetric composition, hyper-maximalist, octane render, photorealism, cinematic realism, unreal engine, 8k ::7 --ar 16:9 --s 1000' },
  ];

  // Style examples for Image-to-Image
  const styleExamples = [
    assets.style1 || assets.example1,
    assets.style2 || assets.example2,
    assets.style3 || assets.example3,
    assets.style4 || assets.example4,
    assets.style5 || assets.example5,
    assets.style6 || assets.example1,
    assets.style7 || assets.example2,
    assets.style8 || assets.example3,
  ];

  // Carousel configuration
  const slidesPerView = 3;

  // Convert URL to File for carousel selection
  const urlToFile = async (url, filename) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch image');
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type });
  };

  const handleSelectStyle = async (url) => {
    try {
      const file = await urlToFile(url, 'style_image.jpg');
      setStyleImage(file);
    } catch (error) {
      console.error('Failed to load style image:', error);
      toast.error('Failed to load style image.');
    }
  };

  // Manage object URLs for previews
  useEffect(() => {
    if (inputImage) {
      const url = URL.createObjectURL(inputImage);
      setInputImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setInputImageUrl(null);
    }
  }, [inputImage]);

  useEffect(() => {
    if (styleImage) {
      const url = URL.createObjectURL(styleImage);
      setStyleImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setStyleImageUrl(null);
    }
  }, [styleImage]);

  // Form submission handler
  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'text-to-image') {
        if (!input.trim()) {
          toast.error('Please enter a prompt.');
          setLoading(false);
          return;
        }
        const result = await generateTextToImage(input);
        let imageUrl;
        if (typeof result === 'string') {
          imageUrl = result;
        } else if (result && result.data && result.data[0] && result.data[0].url) {
          imageUrl = result.data[0].url;
        } else {
          throw new Error('Invalid response from generateTextToImage');
        }
        setImage(imageUrl);
        setIsImageLoaded(true);
      } else if (mode === 'image-to-image') {
        if (!inputImage || !styleImage || !i2iPrompt.trim()) {
          toast.error('Please provide all required inputs: input image, style image, and prompt.');
          setLoading(false);
          return;
        }
        const result = await generateImageToImage(inputImage, styleImage, i2iPrompt, param1, param2);
        let imageUrl;
        if (typeof result === 'string') {
          imageUrl = result;
        } else if (result && result.data && result.data[0] && result.data[0].url) {
          imageUrl = result.data[0].url;
        } else {
          throw new Error('Invalid Uploads for Image To Image');
        }
        setImage(imageUrl);
        setIsImageLoaded(true);
      }
    } catch (error) {
      if (error.response?.status === 402) {
        toast.error('Insufficient credits to generate image.');
        navigate('/buy');
      } else {
        toast.error('An error occurred during generation: ' + error.message);
        console.error('Generation error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0.2, y: 100 }}
      transition={{ duration: 1 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onSubmit={onSubmitHandler}
      className="flex flex-col min-h-[90vh] justify-center items-center p-6 space-y-8 bg-white"
    >
      {/* Mode Selection Dropdown */}
      {!isImageLoaded && (
        <div className="w-full max-w-md">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Generation Mode:</label>
          <div className="relative">
            <select
              value={mode}
              onChange={(e) => {
                setMode(e.target.value);
                setIsImageLoaded(false);
                setInput('');
                setI2iPrompt('');
                setInputImage(null);
                setStyleImage(null);
                setParam1(20);
                setParam2(0.5);
              }}
              className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2 px-3 pr-8 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="text-to-image">Text to Image</option>
              <option value="image-to-image">Image to Image</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-600">▼</div>
          </div>
        </div>
      )}

      {/* Text-to-Image Input */}
      {mode === 'text-to-image' && !isImageLoaded && (
        <div className="w-full max-w-4xl space-y-6">
          <div className="flex items-center bg-white border border-gray-200 rounded-full shadow-md overflow-hidden">
            <input
              onChange={(e) => setInput(e.target.value)}
              value={input}
              type="text"
              placeholder="Describe what you want to generate"
              className="flex-1 py-3 px-6 text-gray-800 placeholder-gray-400 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-gray-800 to-gray-700 text-white py-3 px-8 rounded-full hover:opacity-90 transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>
      )}

      {/* Image-to-Image Grid */}
      {mode === 'image-to-image' && (
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Input Image Column */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Input Image</label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setInputImage(e.target.files[0])}
                className="hidden"
                id="input-image"
              />
              <label htmlFor="input-image" className="cursor-pointer">
                <div className="w-64 h-64 border rounded-lg shadow flex items-center justify-center bg-gray-100">
                  {inputImageUrl ? (
                    <img src={inputImageUrl} alt="Input Preview" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-gray-500">Click to upload image</span>
                  )}
                </div>
              </label>
              {inputImage && (
                <button
                  type="button"
                  onClick={() => setInputImage(null)}
                  className="absolute top-2 left-1 bg-teal-500 text-white rounded-full p-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <label className="block text-sm font-medium text-gray-700">Prompt</label>
            <input
              type="text"
              value={i2iPrompt}
              onChange={(e) => setI2iPrompt(e.target.value)}
              placeholder="Describe what you want to generate"
              className="w-full py-3 px-4 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label className="block text-sm font-medium text-gray-700">
              Image Strength: 
            </label>
            <LiquidSlider min={0} max={50} step={1} value={param1} onChange={setParam1} />
          </div>

          {/* Style Image Column */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Style Image</label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setStyleImage(e.target.files[0])}
                className="hidden"
                id="style-image"
              />
              <label htmlFor="style-image" className="cursor-pointer">
                <div className="w-64 h-64 border rounded-lg shadow flex items-center justify-center bg-gray-100">
                  {styleImageUrl ? (
                    <img src={styleImageUrl} alt="Style Preview" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-gray-500">Click to upload style</span>
                  )}
                </div>
              </label>
              {styleImage && (
                <button
                  type="button"
                  onClick={() => setStyleImage(null)}
                  className="absolute top-2 left-1 bg-teal-500 text-white rounded-full p-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <label className="block text-sm font-medium text-gray-700">
              Style Strength: 
            </label>
            <LiquidSlider min={0} max={1} step={0.1} value={param2} onChange={setParam2} />
            <div className="max-w-4xl mt-8">
              <label className="block text-sm font-medium text-gray-700">Or Choose from Examples</label>
              <Swiper
                modules={[Navigation, Autoplay]}
                spaceBetween={5}
                slidesPerView={slidesPerView}
                centeredSlides={true}
                loop={true}
                autoplay={{ delay: 999, disableOnInteraction: false }}
                onInit={(swiper) => setActiveIndex(swiper.realIndex)}
                onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
                breakpoints={{
                  640: { slidesPerView: 2 },
                  768: { slidesPerView: 3 },
                  1024: { slidesPerView: 4 },
                }}
                className="mt-2"
              >
                {styleExamples.map((img, index) => (
                  <SwiperSlide key={index}>
                    <img
                      src={img}
                      alt={`Style example ${index + 1}`}
                      onClick={() => handleSelectStyle(img)}
                      className={`cursor-pointer rounded-lg h-24 w-full object-cover ${
                        styleImageUrl === img ? 'border-2 border-blue-500' : ''
                      }`}
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>

          {/* Generated Image Column */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Generated Image</label>
            <div className="relative w-64 h-64 border rounded-lg shadow overflow-hidden">
              {isImageLoaded ? (
                <motion.img
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  src={image}
                  alt="Generated result"
                  className="w-full h-full object-contain"
                  onError={() => console.error('Failed to load generated image at URL:', image)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <span className="text-gray-500">Generated image will appear here</span>
                </div>
              )}
              {loading && (
                <motion.span
                  className="absolute bottom-0 left-0 h-1 rounded-full bg-gradient-to-r from-blue-400 to-green-500"
                  animate={{ width: '100%' }}
                  transition={{ duration: 10 }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Generate Button for Image-to-Image */}
      {!isImageLoaded && mode === 'image-to-image' && (
        <div className="w-full max-w-md">
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-gray-800 to-gray-700 text-white py-3 px-8 rounded-full hover:opacity-90 transition disabled:opacity-50"
            disabled={loading || !inputImage || !styleImage || !i2iPrompt}
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      )}

      {/* Generated Image for Text-to-Image */}
      {mode === 'text-to-image' && (
        <div className="flex flex-col items-center space-y-4">
          <div className="max-w-sm border rounded-lg shadow-lg overflow-hidden relative">
            <motion.img
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              src={image}
              alt="Generated result"
              className="w-full h-auto object-contain"
              onError={() => console.error('Failed to load generated image at URL:', image)}
            />
            {loading && (
              <motion.span
                className="absolute bottom-0 left-0 h-1 rounded-full bg-gradient-to-r from-blue-400 to-green-500"
                animate={{ width: '100%' }}
                transition={{ duration: 10 }}
              />
            )}
          </div>
          {loading && <p className="text-sm font-medium text-blue-600 animate-pulse">Loading...</p>}
        </div>
      )}

      {/* Carousel for Text-to-Image */}
      {!isImageLoaded && mode === 'text-to-image' && (
        <div className="w-full max-w-4xl mt-8">
          <Swiper
            modules={[Navigation, Autoplay]}
            spaceBetween={20}
            slidesPerView={slidesPerView}
            centeredSlides={true}
            loop={true}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            navigation={true}
            className="mySwiper"
            onInit={(swiper) => setActiveIndex(swiper.realIndex)}
            onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
          >
            {exampleImages.map((item, index) => (
              <SwiperSlide key={index}>
                <div
                  className={`cursor-pointer bg-gray-800 rounded-lg shadow-lg overflow-hidden ${
                    index === activeIndex ? '' : 'filter blur-md'
                  }`}
                  onClick={() => setInput(item.prompt)}
                >
                  <img
                    src={item.image}
                    alt={`Sample image for prompt: ${item.prompt}`}
                    className="w-full h-48 object-cover"
                  />
                   <div className="
                    p-2 
                    bg-gray-900 bg-opacity-75 
                    text-white text-sm 
                    font-mono 
                    overflow-hidden 
                    whitespace-nowrap 
                    text-ellipsis
                  "
                   style={{ width: '50ch' }}
                   >
                    {item.prompt}
                   </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      {/* Post-Generation Buttons */}
      {isImageLoaded && (
        <div className="flex gap-4 flex-wrap justify-center mt-10">
          <button
            onClick={() => setIsImageLoaded(false)}
            className="bg-white border border-gray-300 text-gray-800 px-8 py-3 rounded-full shadow hover:bg-gray-50 transition"
          >
            Generate Another
          </button>
          <a
            href={image}
            download="generated_image.png"
            className="bg-gradient-to-r from-gray-800 to-gray-700 text-white px-10 py-3 rounded-full shadow hover:opacity-90 transition"
          >
            Download
          </a>
        </div>
      )}
    </motion.form>
  );
};

export default Result;
