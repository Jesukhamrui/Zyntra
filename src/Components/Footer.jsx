import { assets } from '../assets/assets';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div className="f">
      <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm ">
        <div className="">
          <img src={assets.logo} alt="" className="mb-5 w-32 " />
          <p className="w-full sm:w-2/3 text-gray-600">
            Shop with Zyntra and experience online shopping like never before.
            From fashion and electronics to home essentials, we&apos;ve got you covered with a wide range of products at your fingertips. Enjoy seamless browsing, secure transactions, and fast delivery—all designed to make your shopping experience effortless and enjoyable.
          </p>
        </div>

        <div className="">
          <p className="text-xl font-medium mb-5">COMPANY</p>
          <ul className="flex flex-col flex-1 text-gray-600 cursor-pointer">
            <li
              onClick={() => {
                window.location.href = '/';
                scrollToTop();
              }}
              className="mb-2"
            >
              Home
            </li>
            <li
              onClick={() => {
                window.location.href = '/about';
                scrollToTop();
              }}
              className="mb-2"
            >
              About Us
            </li>
            <li
              onClick={() => {
                window.location.href = '/about';
                scrollToTop();
              }}
              className="mb-2"
            >
              Delivery
            </li>
            <li
              onClick={() => {
                window.location.href = '/about';
                scrollToTop();
              }}
              className="mb-2"
            >
              Privacy policy
            </li>
          </ul>
        </div>

        <div className="">
          <p className="text-xl font-medium mb-5">GET IN TOUCH</p>
          <ul className="flex flex-col flex-1 text-gray-600">
            <li className="mb-2">+8597822373</li>
            <li className="mb-2">jesukhamrui@gmail.com</li>
          </ul>
        </div>
      </div>
      <div>
        <hr />
        <p className="py-5 text-sm text-center">
          Zyntra – Where Choice Meets Convenience..
        </p>
      </div>
    </div>
  );
};

export default Footer;
