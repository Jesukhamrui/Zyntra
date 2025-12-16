import { assets } from '../assets/assets';
import NewsLetterBox from '../Components/NewsLetterBox';
import Title from '../Components/Title';

const About = () => {
  return (
    <div>
      <div className="text-2xl text-center pt-8 border-t">
        <Title text1={'ABOUT'} text2={'US'} />
      </div>

      <div className="flex flex-col md:flex-row gap-16 my-10">
        <img
          src={assets.about_img}
          alt=""
          className="w-full md:max-w-[450px] "
        />

        <div className="flex flex-col justify-center gap-6 md:w-2/4 text-gray-600">
          <p>
            Zyntra was born from a passion for innovation and a vision to reshape the way people shop online. Our journey began with a simple goal: to create a platform where customers can effortlessly discover, explore, and purchase a wide variety of products—all from the comfort of their homes.
          </p>
          <p>
            Since our inception, we&apos;ve worked firelessly to curate a
            diverse selection of high-quality products that cater to every taste
            and preference. From fashion and beauty to electronics and home
            essentials, we offer an extensive collection sourced from frusted
            brands and suppliers.
          </p>
          <b className="text-gray-800">Our Mission</b>
          <p>
            {' '}
            Our Mission
            At Zyntra, our mission is to empower customers with choice, convenience, and confidence. We're committed to delivering a seamless shopping experience that goes beyond expectations—from browsing and ordering to delivery and beyond.
          </p>
        </div>
      </div>

      <div className="py-4 text-2xl">
        <Title text1={'WHY'} text2={'CHOOSE US'} />
      </div>

      <div className="flex flex-col md:flex-row mb-20 text-sm gap-4">
        <div className="border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5">
          <b>Quality Assurance</b>
          <p className="text-gray-600">
            We take pride in offering only top-quality products that meet our strict standards for durability, performance, and overall value.{' '}
          </p>
        </div>
        <div className="border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5">
          <b>Convenience</b>
          <p className="text-gray-600">
            Our user-friendly website and mobile app make it simple to browse, compare, and shop for products anytime, anywhere.
            {' '}
          </p>
        </div>
        <div className="border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5">
          <b>Exceptional Customer Services</b>
          <p className="text-gray-600">
            Our dedicated customer support team is available 24/7 to assist you with any questions or concerns you may have.{' '}
          </p>
        </div>
      </div>

      <NewsLetterBox />
    </div>
  );
};

export default About;
