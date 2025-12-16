import { useState, useRef, useEffect, useContext, useMemo } from 'react';
import { assets, hero_images } from '../assets/assets';
import { ShopContext } from '../Context/ShopContext';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const { products } = useContext(ShopContext);
  const navigate = useNavigate();

  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const sliderRef = useRef(null);

  // Build slides: prefer latest product images (with id) otherwise fall back to hero_images
  const slides = useMemo(() => {
    if (products && products.length) {
      return [...products]
        .sort((a, b) => b.date - a.date)
        .slice(0, 10)
        .map((p) => ({ id: p._id, img: p.image && p.image[0] ? p.image[0] : assets.hero_img }));
    }
    if (hero_images && hero_images.length) return hero_images.map((img) => ({ id: null, img }));
    return [{ id: null, img: assets.hero_img }];
  }, [products]);

  // autoplay (pause on hover)
  useEffect(() => {
    if (!slides || slides.length <= 1) return;
    const t = setInterval(() => {
      if (!isHovered) setIndex((i) => (i + 1) % slides.length);
    }, 3500);
    return () => clearInterval(t);
  }, [isHovered, slides]);

  // keep index in range if slides change
  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [index, slides.length]);

  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setIndex((i) => (i + 1) % slides.length);

  const onClickSlide = (s) => {
    if (s.id) navigate(`/product/${s.id}`);
  };

  return (
    <div className="flex flex-col sm:flex-row border border-gray-400">
      {/* Hero Left Side (unchanged) */}
      <div className="w-full sm:w-1/2 flex items-center justify-center py-10 sm:py-0">
        <div className="text-[#414141]">
          <div className="flex items-center gap-2">
            <p className="w-8 md:w-11 h-[2px] bg-[#414141]"></p>
            <p className="font-medium text-sm md:text-base">OUR BESTSELLERS</p>
          </div>
          <h1 className="prata-regular text-3xl sm:py-3 lg:text-5xl leading-relaxed">Latest Arrivals</h1>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm md:text-base">SHOP NOW</p>
            <p className="w-8 md:w-11 h-[1px] bg-[#414141]"></p>
          </div>
        </div>
      </div>

      {/* Hero Right Side - autoplay image slider */}
      <div
        className="w-full sm:w-1/2 relative flex items-center justify-center py-6"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          aria-label="previous"
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white border rounded-full shadow flex items-center justify-center hover:bg-gray-100"
        >
          ‹
        </button>

        <div className="w-full overflow-hidden">
          <div
            ref={sliderRef}
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {slides.map((s, i) => (
              <div key={i} className="w-full flex-shrink-0 cursor-pointer" onClick={() => onClickSlide(s)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onClickSlide(s); }}>
                <img src={s.img} alt={`hero-${i}`} className="w-full h-72 sm:h-96 object-cover" />
              </div>
            ))}
          </div>
        </div>

        <button
          aria-label="next"
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white border rounded-full shadow flex items-center justify-center hover:bg-gray-100"
        >
          ›
        </button>
      </div>
    </div>
  );
};

export default Hero;
