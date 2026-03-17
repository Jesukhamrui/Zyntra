import { useContext, useState } from 'react';
import { assets } from '../assets/assets';
import CartTotal from '../Components/CartTotal';
import Title from '../Components/Title';
import { ShopContext } from '../Context/ShopContext';
import { toast } from 'react-toastify';

const PlaceOrder = () => {
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
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

  const [orderPlaced, setOrderPlaced] = useState(false);
  const { navigate, addOrder, getCartCount } = useContext(ShopContext);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    const sanitizedValue =
      name === 'zipcode'
        ? value.replace(/\D/g, '').slice(0, 6)
        : name === 'phone'
          ? value.replace(/\D/g, '').slice(0, 10)
          : value;

    setFormData((prev) => ({
      ...prev,
      [name]: sanitizedValue,
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
    if (!/^\d{6}$/.test(zipcode)) {
      toast.error('Zipcode must be exactly 6 digits');
      return false;
    }
    if (!country.trim()) {
      toast.error('Country is required');
      return false;
    }
    if (!phone.trim() || !/^[6-9]\d{9}$/.test(phone)) {
      toast.error('Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9');
      return false;
    }
    if (/^(\d)\1{9}$/.test(phone)) {
      toast.error('Enter an authentic mobile number');
      return false;
    }

    return true;
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported in this browser');
      return;
    }

    setIsFetchingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );

          if (!response.ok) {
            throw new Error('Failed to fetch location details');
          }

          const data = await response.json();
          const address = data.address || {};

          const street = [address.house_number, address.road].filter(Boolean).join(' ').trim();
          const city = address.city || address.town || address.village || address.county || '';
          const postcode = (address.postcode || '').replace(/\D/g, '').slice(0, 6);

          setFormData((prev) => ({
            ...prev,
            street: street || prev.street,
            city: city || prev.city,
            state: address.state || prev.state,
            country: address.country || prev.country,
            zipcode: postcode || prev.zipcode,
          }));

          toast.success('Location fetched. Please verify and complete your details.');
        } catch {
          toast.error('Unable to fetch address details from current location');
        } finally {
          setIsFetchingLocation(false);
        }
      },
      () => {
        toast.error('Unable to access your current location');
        setIsFetchingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handlePlaceOrder = () => {
    if (isPlacingOrder) return;

    if (getCartCount() === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (validateForm()) {
      setIsPlacingOrder(true);
      const deliveryInfo = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        street: formData.street,
        city: formData.city,
        state: formData.state,
        zipcode: formData.zipcode,
        country: formData.country,
        phone: formData.phone,
      };

      addOrder(deliveryInfo, paymentMethod);
      setOrderPlaced(true);
      setIsPlacingOrder(false);
    }
  };

  const handleContinueShopping = () => {
    navigate('/');
  };

  const handleViewOrders = () => {
    navigate('/profile?tab=orders');
  };

  if (orderPlaced) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <div className="text-center max-w-md">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Order Placed Successfully!
          </h1>
          <p className="text-gray-600 text-lg mb-2">Thank you for your order</p>
          <p className="text-gray-500 text-sm mb-8">
            We&apos;ve received your order and will process it shortly. You can track your order status anytime.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-8 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">Order Details:</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <span className="font-medium text-gray-900">Name:</span> {formData.firstName}{' '}
                {formData.lastName}
              </p>
              <p>
                <span className="font-medium text-gray-900">Email:</span> {formData.email}
              </p>
              <p>
                <span className="font-medium text-gray-900">Phone:</span> {formData.phone}
              </p>
              <p>
                <span className="font-medium text-gray-900">Address:</span> {formData.street},{' '}
                {formData.city}
              </p>
              <p>
                <span className="font-medium text-gray-900">Payment Method:</span>{' '}
                {paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={handleViewOrders}
              className="flex-1 bg-black text-white px-6 py-3 rounded font-medium hover:bg-gray-800 transition"
            >
              View My Orders
            </button>
            <button
              onClick={handleContinueShopping}
              className="flex-1 border border-gray-400 text-gray-900 px-6 py-3 rounded font-medium hover:bg-gray-100 transition"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t">
      {/* --------------- Left Side ----------------------- */}

      <div className="flex flex-col gap-4 w-full sm:max-w-[480px]">
        <div className="text-xl sm:text-2xl my-3 ">
          <Title text1={'DELIVERY'} text2={'INFORMATION'} />
        </div>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isFetchingLocation}
          className="border border-gray-300 rounded py-2 px-3.5 w-full text-sm hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isFetchingLocation ? 'Fetching Location...' : 'Use Current Location'}
        </button>
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
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            title="Zipcode must be exactly 6 digits"
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
          inputMode="numeric"
          pattern="[6-9][0-9]{9}"
          maxLength={10}
          title="Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9"
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
              disabled={isPlacingOrder}
              className="bg-black text-white px-16 py-3 text-sm hover:bg-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPlacingOrder ? 'PLACING ORDER...' : 'PLACE ORDER'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceOrder;
