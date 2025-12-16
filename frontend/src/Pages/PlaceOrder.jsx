import { useContext, useState } from 'react';
import { assets } from '../assets/assets';
import CartTotal from '../Components/CartTotal';
import Title from '../Components/Title';
import { ShopContext } from '../Context/ShopContext';
import { toast } from 'react-toastify';

const PlaceOrder = () => {
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    street: '',
    city: '',
    state: '',
    zipcode: '',
    country: '',
    phone: '',
  });

  const { navigate } = useContext(ShopContext);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const { firstName, lastName, email, street, city, state, zipcode, country, phone } = formData;

    if (!firstName.trim()) {
      toast.error('First Name is required');
      return false;
    }
    if (!lastName.trim()) {
      toast.error('Last Name is required');
      return false;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      toast.error('Valid Email is required');
      return false;
    }
    if (!street.trim()) {
      toast.error('Street is required');
      return false;
    }
    if (!city.trim()) {
      toast.error('City is required');
      return false;
    }
    if (!state.trim()) {
      toast.error('State is required');
      return false;
    }
    if (!zipcode.trim()) {
      toast.error('Zipcode is required');
      return false;
    }
    if (!country.trim()) {
      toast.error('Country is required');
      return false;
    }
    if (!phone.trim() || !/^\d{10}$/.test(phone)) {
      toast.error('Valid 10-digit Phone Number is required');
      return false;
    }

    return true;
  };

  const handlePlaceOrder = () => {
    if (validateForm()) {
      navigate('/orders');
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t">
      {/* --------------- Left Side ----------------------- */}

      <div className="flex flex-col gap-4 w-full sm:max-w-[480px]">
        <div className="text-xl sm:text-2xl my-3 ">
          <Title text1={'DELIVERY'} text2={'INFORMATION'} />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleInputChange}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            required
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={handleInputChange}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            required
          />
        </div>
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleInputChange}
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          required
        />
        <input
          type="text"
          name="street"
          placeholder="Street"
          value={formData.street}
          onChange={handleInputChange}
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          required
        />
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            name="city"
            placeholder="City"
            value={formData.city}
            onChange={handleInputChange}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            required
          />
          <input
            type="text"
            name="state"
            placeholder="State"
            value={formData.state}
            onChange={handleInputChange}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            required
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            name="zipcode"
            placeholder="Zipcode"
            value={formData.zipcode}
            onChange={handleInputChange}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            required
          />
          <input
            type="text"
            name="country"
            placeholder="Country"
            value={formData.country}
            onChange={handleInputChange}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            required
          />
        </div>
        <input
          type="tel"
          name="phone"
          placeholder="Phone"
          value={formData.phone}
          onChange={handleInputChange}
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          required
        />
      </div>

      {/* --------------- Right Side ----------------------- */}

      <div className="mt-8">
        <div className="mt-8 min-w-80">
          <CartTotal />
        </div>

        <div className="mt-12">
          <Title text1={'PAYMENT'} text2={'METHOD'} />

          {/* -------------- Payment method selection -------------- */}

          <div className="flex flex-col lg:flex-row gap-4">
            <div
              onClick={() => {
                setPaymentMethod('phonepe');
              }}
              className="flex items-center gap-3 border p-2 px-3 cursor-pointer"
            >
              <p
                className={` min-w-3.5 h-3.5 border rounded-full ${
                  paymentMethod === 'phonepe' ? 'bg-green-400' : ''
                }`}
              ></p>
              <img className="h-6 w-auto mx-4" src={assets.phonepe_logo} alt="PhonePe" />
            </div>
            <div
              onClick={() => {
                setPaymentMethod('razorpay');
              }}
              className="flex items-center gap-3 border p-2 px-3 cursor-pointer"
            >
              <p
                className={` min-w-3.5 h-3.5 border rounded-full ${
                  paymentMethod === 'razorpay' ? 'bg-green-400' : ''
                }`}
              ></p>
              <img className="h-6 w-auto mx-4" src={assets.paytm_logo} alt="Paytm" />
            </div>
            <div
              onClick={() => {
                setPaymentMethod('cod');
              }}
              className="flex items-center gap-3 border p-2 px-3 cursor-pointer"
            >
              <p
                className={` min-w-3.5 h-3.5 border rounded-full ${
                  paymentMethod === 'cod' ? 'bg-green-400' : ''
                }`}
              ></p>
              <p className="text-gray-500 text-sm font-medium mx-4">
                CASH ON DELIVERY
              </p>
            </div>
          </div>

          {/* -------------- Payment method selection -------------- */}

          <div className="w-full text-end mt-8">
            <button
              onClick={handlePlaceOrder}
              className="bg-black text-white px-16 py-3 text-sm hover:bg-gray-800 transition"
            >
              PLACE ORDER
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceOrder;
