import { useContext, useState } from 'react';
import { assets } from '../assets/assets';
import CartTotal from '../Components/CartTotal';
import ProductItem from '../Components/ProductItem';
import Title from '../Components/Title';
import { ShopContext } from '../Context/ShopContext';
import { toast } from 'react-toastify';

// ─── Zipcode overrides ────────────────────────────────────────────────────────

const ZIPCODE_ADDRESS_OVERRIDES = {
  '700124': {
    city: 'Barasat',
    state: 'West Bengal',
    country: 'India',
  },
};

const normalizeZipcode = (value = '') =>
  String(value || '').replace(/\D/g, '').slice(0, 6);

const getZipcodeOverride = (zipcode = '') =>
  ZIPCODE_ADDRESS_OVERRIDES[normalizeZipcode(zipcode)] || null;

const applyZipcodeOverride = (addressData = {}) => {
  const normalizedZip = normalizeZipcode(addressData.zipcode || '');
  const override = getZipcodeOverride(normalizedZip);
  if (!override) return { ...addressData, zipcode: normalizedZip };
  return {
    ...addressData,
    zipcode: normalizedZip,
    city: override.city,
    state: override.state,
    country: override.country || addressData.country,
  };
};

// ─── Fetch with timeout ───────────────────────────────────────────────────────

const fetchWithTimeout = (url, options = {}, timeoutMs = 8000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
};

// ─── Geolocation helpers ──────────────────────────────────────────────────────

const getCurrentPosition = (options) =>
  new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, options)
  );

const requestCurrentPositionWithFallback = async () => {
  const configs = [
    { enableHighAccuracy: true,  timeout: 15000, maximumAge: 0 },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
  ];
  let lastError;
  for (const opts of configs) {
    try {
      return await getCurrentPosition(opts);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError ?? new Error('Unable to access your current location');
};

const getLocationPrecisionLabel = (accuracyInMeters) => {
  if (!Number.isFinite(accuracyInMeters)) return 'Exact GPS';
  if (accuracyInMeters <= 100) return 'Exact GPS';
  return `Approximate GPS (±${Math.round(accuracyInMeters)} m)`;
};

/**
 * Primary geocoder — BigDataCloud
 * Browser-friendly, no API key required, good coverage in India.
 * https://www.bigdatacloud.com/geocoding-apis/free-reverse-geocode-to-city-api
 */
const fetchAddressFromLocation = async (latitude, longitude) => {
  const url =
    `https://api.bigdatacloud.net/data/reverse-geocode-client` +
    `?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;

  const response = await fetchWithTimeout(url, {}, 8000);
  if (!response.ok)
    throw new Error(`BigDataCloud HTTP ${response.status}`);

  const data = await response.json();

  const street = [
    data.locality,
    data.localityInfo?.administrative?.[4]?.name,
  ]
    .filter(Boolean)
    .join(', ')
    .trim();

  const city =
    data.city ||
    data.locality ||
    data.localityInfo?.administrative?.[3]?.name ||
    data.principalSubdivision ||
    '';

  const state    = data.principalSubdivision || '';
  const country  = data.countryName          || 'India';
  const postcode = normalizeZipcode(data.postcode || '');

  return { street, city, state, postcode, country };
};

/**
 * IP fallback geocoder — tries two providers in sequence so one blocked/rate-
 * limited source doesn't silently fail the whole fallback.
 *
 * 1. ip-api.com  — good India coverage, free, returns a status field
 * 2. ipwho.is    — no key, HTTPS, permissive CORS, solid backup
 */
const fetchApproximateAddressFromIP = async () => {
  // ── Provider 1: ip-api.com ──────────────────────────────────────────────
  try {
    const res = await fetchWithTimeout(
      'https://ip-api.com/json/?fields=status,city,regionName,zip,country',
      {},
      6000
    );
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success' && (data.city || data.regionName)) {
        return {
          street:   '',
          city:     data.city       || '',
          state:    data.regionName || '',
          postcode: normalizeZipcode(data.zip || ''),
          country:  data.country    || 'India',
        };
      }
    }
  } catch (_) {
    // fall through to provider 2
  }

  // ── Provider 2: ipwho.is ────────────────────────────────────────────────
  const res2 = await fetchWithTimeout('https://ipwho.is/', {}, 6000);
  if (!res2.ok) throw new Error(`ipwho.is HTTP ${res2.status}`);

  const data2 = await res2.json();
  if (!data2.success) throw new Error('ipwho.is returned failure status');

  return {
    street:   '',
    city:     data2.city        || '',
    state:    data2.region      || '',
    postcode: normalizeZipcode(data2.postal || ''),
    country:  data2.country     || 'India',
  };
};

// ─── UPI validation ───────────────────────────────────────────────────────────

const UPI_ID_REGEX = /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/;

// ─── Component ────────────────────────────────────────────────────────────────

const PlaceOrder = () => {
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [upiId, setUpiId] = useState('');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [locationPrecision, setLocationPrecision] = useState('');
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
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [locationHint, setLocationHint] = useState('');
  const { navigate, addOrder, getCartCount, products, cartItems } = useContext(ShopContext);
  const requiresUpiId = paymentMethod === 'phonepe' || paymentMethod === 'razorpay';

  const buildRecommendedProducts = () => {
    const orderedProductIds = new Set(
      Object.entries(cartItems)
        .filter(([, sizes]) => Object.values(sizes || {}).some((quantity) => Number(quantity) > 0))
        .map(([productId]) => productId)
    );

    const orderedCategories = new Set(
      products
        .filter((product) => orderedProductIds.has(product._id))
        .map((product) => product.category)
    );

    const availableProducts = products.filter(
      (product) => !orderedProductIds.has(product._id)
    );
    const sameCategoryProducts = availableProducts.filter((product) =>
      orderedCategories.has(product.category)
    );
    const bestsellerProducts = availableProducts.filter(
      (product) => product.bestseller
    );

    const prioritized = [
      ...sameCategoryProducts,
      ...bestsellerProducts,
      ...availableProducts,
    ];

    const uniqueProducts = [];
    const addedIds = new Set();
    for (const product of prioritized) {
      if (!addedIds.has(product._id)) {
        uniqueProducts.push(product);
        addedIds.add(product._id);
      }
      if (uniqueProducts.length === 8) break;
    }

    return uniqueProducts;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    const sanitizedValue =
      name === 'zipcode'
        ? value.replace(/\D/g, '').slice(0, 6)
        : name === 'phone'
          ? value.replace(/\D/g, '').slice(0, 10)
          : value;

    setFormData((prev) => {
      const nextData = { ...prev, [name]: sanitizedValue };
      return applyZipcodeOverride(nextData);
    });

    if (name === 'zipcode') {
      const override = getZipcodeOverride(sanitizedValue);
      if (override) {
        setLocationHint(
          `Using PIN ${sanitizedValue}: ${override.city}, ${override.state}`
        );
        setLocationPrecision('');
        return;
      }
      if (/^\d{6}$/.test(sanitizedValue)) {
        setLocationHint(`Verified PIN ${sanitizedValue}`);
        setLocationPrecision('');
      } else {
        setLocationHint('');
        setLocationPrecision('');
      }
    }
  };

  const validateForm = () => {
    const { firstName, lastName, email, street, city, state, zipcode, country, phone } =
      formData;

    if (!firstName.trim()) { toast.error('First Name is required'); return false; }
    if (!lastName.trim())  { toast.error('Last Name is required');  return false; }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      toast.error('Valid Email is required'); return false;
    }
    if (!street.trim())  { toast.error('Street is required');  return false; }
    if (!city.trim())    { toast.error('City is required');    return false; }
    if (!state.trim())   { toast.error('State is required');   return false; }
    if (!zipcode.trim()) { toast.error('Zipcode is required'); return false; }
    if (!/^\d{6}$/.test(zipcode)) {
      toast.error('Zipcode must be exactly 6 digits'); return false;
    }
    if (!country.trim()) { toast.error('Country is required'); return false; }
    if (!phone.trim() || !/^[6-9]\d{9}$/.test(phone)) {
      toast.error('Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9');
      return false;
    }
    if (/^(\d)\1{9}$/.test(phone)) {
      toast.error('Enter an authentic mobile number'); return false;
    }

    return true;
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported in this browser');
      return;
    }
    if (!window.isSecureContext) {
      toast.error(
        'Current location works only on HTTPS (or localhost). Please open the site securely.'
      );
      return;
    }

    setIsFetchingLocation(true);

    try {
      const position = await requestCurrentPositionWithFallback();
      const { latitude, longitude, accuracy } = position.coords;
      const precisionLabel = getLocationPrecisionLabel(accuracy);

      try {
        const address = await fetchAddressFromLocation(latitude, longitude);

        setFormData((prev) =>
          applyZipcodeOverride({
            ...prev,
            street:  address.street  || prev.street,
            city:    address.city    || prev.city,
            state:   address.state   || prev.state,
            country: address.country || prev.country,
            zipcode: address.postcode || prev.zipcode,
          })
        );

        const override = getZipcodeOverride(address.postcode);
        if (override) {
          setLocationHint(
            `Using PIN ${address.postcode}: ${override.city}, ${override.state}`
          );
          setLocationPrecision(precisionLabel);
        } else if (address.city && address.state) {
          setLocationHint(`Detected: ${address.city}, ${address.state}`);
          setLocationPrecision(precisionLabel);
        } else {
          setLocationHint(
            'Location captured. Please complete address details manually.'
          );
          setLocationPrecision(precisionLabel);
        }

        if (accuracy > 100) {
          toast.info(
            `Your device reported approximate location accuracy of about ±${Math.round(accuracy)} m.`
          );
        }

        toast.success(
          'Location fetched successfully. Please verify and complete your details.'
        );
      } catch (error) {
        console.error('Reverse geocoding error:', error);
        setLocationHint(
          'Location captured, but address lookup failed. Please fill the fields manually.'
        );
        toast.error('Location captured, but address details could not be fetched.');
      }
    } catch (error) {
      if (error.code === 1) {
        toast.error(
          'Location permission denied. Please enable location access in browser settings.'
        );
      } else {
        try {
          const approxAddress = await fetchApproximateAddressFromIP();

          setFormData((prev) =>
            applyZipcodeOverride({
              ...prev,
              city:    approxAddress.city     || prev.city,
              state:   approxAddress.state    || prev.state,
              country: approxAddress.country  || prev.country,
              zipcode: approxAddress.postcode || prev.zipcode,
            })
          );

          const override = getZipcodeOverride(approxAddress.postcode);
          if (override) {
            setLocationHint(
              `Approximate location: PIN ${approxAddress.postcode} (${override.city}, ${override.state}). Please verify.`
            );
            setLocationPrecision('Approximate Network');
          } else if (approxAddress.city && approxAddress.state) {
            setLocationHint(
              `Approximate location: ${approxAddress.city}, ${approxAddress.state}. Please verify manually.`
            );
            setLocationPrecision('Approximate Network');
          } else {
            setLocationHint(
              'Unable to detect exact location. Please fill delivery address manually.'
            );
            setLocationPrecision('Approximate Network');
          }

          toast.warning(
            'Precise location unavailable. Filled approximate location from network.'
          );
        } catch (fallbackError) {
          console.error('GPS error:', error);
          console.error('IP fallback error:', fallbackError);
          setLocationHint(
            'Could not detect your location automatically. Please fill in your delivery address manually.'
          );
          setLocationPrecision('');
          toast.error('Location detection failed. Please enter your address manually.');
        }
      }
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handlePlaceOrder = () => {
    if (isPlacingOrder) return;

    if (getCartCount() === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (validateForm()) {
      const normalizedUpiId = upiId.trim().toLowerCase();

      if (requiresUpiId) {
        if (!UPI_ID_REGEX.test(normalizedUpiId)) {
          toast.error('Enter a valid UPI ID (example: name@okhdfcbank)');
          return;
        }
        const paymentLabel = paymentMethod === 'phonepe' ? 'PhonePe' : 'Paytm';
        const isUpiConfirmed = window.confirm(
          `Confirm UPI payment with ${normalizedUpiId}?`
        );
        if (!isUpiConfirmed) {
          toast.info(`${paymentLabel} payment confirmation cancelled`);
          return;
        }
      }

      setIsPlacingOrder(true);

      const deliveryInfo = {
        firstName: formData.firstName,
        lastName:  formData.lastName,
        email:     formData.email,
        street:    formData.street,
        city:      formData.city,
        state:     formData.state,
        zipcode:   formData.zipcode,
        country:   formData.country,
        phone:     formData.phone,
        ...(requiresUpiId ? { upiId: normalizedUpiId } : {}),
      };

      const selectedPaymentMethod = requiresUpiId
        ? `${paymentMethod} (${normalizedUpiId})`
        : paymentMethod;

      setRecommendedProducts(buildRecommendedProducts());
      addOrder(deliveryInfo, selectedPaymentMethod);
      setOrderPlaced(true);
      setIsPlacingOrder(false);
    }
  };

  const handleContinueShopping = () => navigate('/');
  const handleViewOrders       = () => navigate('/profile?tab=orders');

  // ─── Order success screen ───────────────────────────────────────────────────

  if (orderPlaced) {
    return (
      <div className="min-h-[80vh] border-t bg-gradient-to-b from-white to-gray-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] items-start">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="mb-6 flex justify-center lg:justify-start">
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

              <div className="text-center lg:text-left">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                  Order Placed Successfully!
                </h1>
                <p className="text-gray-600 text-lg mb-2">Thank you for your order</p>
                <p className="text-gray-500 text-sm mb-6">
                  We&apos;ve received your order and will process it shortly. You can track
                  your order status anytime.
                </p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 sm:p-5 mb-6 text-left">
                <h3 className="font-semibold text-gray-900 mb-3">Order Details:</h3>
                <div className="grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                  <p>
                    <span className="font-medium text-gray-900">Name:</span>{' '}
                    {formData.firstName} {formData.lastName}
                  </p>
                  <p>
                    <span className="font-medium text-gray-900">Email:</span>{' '}
                    {formData.email}
                  </p>
                  <p>
                    <span className="font-medium text-gray-900">Phone:</span>{' '}
                    {formData.phone}
                  </p>
                  <p>
                    <span className="font-medium text-gray-900">Address:</span>{' '}
                    {formData.street}, {formData.city}
                  </p>
                  <p className="sm:col-span-2">
                    <span className="font-medium text-gray-900">Payment Method:</span>{' '}
                    {paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={handleViewOrders}
                  className="flex-1 bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition"
                >
                  View My Orders
                </button>
                <button
                  onClick={handleContinueShopping}
                  className="flex-1 border border-gray-300 text-gray-900 px-6 py-3 rounded-xl font-medium hover:bg-gray-100 transition"
                >
                  Continue Shopping
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 text-xl">
                  Highly Recommended For You
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Based on your latest order, explore more items from the store.
                </p>
              </div>

              {recommendedProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4">
                  {recommendedProducts.map((item) => (
                    <ProductItem
                      key={item._id}
                      id={item._id}
                      image={item.image}
                      name={item.name}
                      price={item.price}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-sm text-gray-500">
                  No recommendations available right now.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Checkout form ──────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t">
      {/* Left Side */}
      <div className="flex flex-col gap-4 w-full sm:max-w-[480px]">
        <div className="text-xl sm:text-2xl my-3">
          <Title text1={'DELIVERY'} text2={'INFORMATION'} />
        </div>

        {locationHint && (
          <div className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 space-y-2">
            {locationPrecision && (
              <div
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                  locationPrecision.startsWith('Exact GPS')
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                Precision: {locationPrecision}
              </div>
            )}
            <div>{locationHint}</div>
          </div>
        )}

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

      {/* Right Side */}
      <div className="mt-8">
        <div className="mt-8 min-w-80">
          <CartTotal />
        </div>

        <div className="mt-12">
          <Title text1={'PAYMENT'} text2={'METHOD'} />

          <div className="flex flex-col lg:flex-row gap-4">
            <div
              onClick={() => setPaymentMethod('phonepe')}
              className="flex items-center gap-3 border p-2 px-3 cursor-pointer"
            >
              <p
                className={`min-w-3.5 h-3.5 border rounded-full ${
                  paymentMethod === 'phonepe' ? 'bg-green-400' : ''
                }`}
              />
              <img className="h-6 w-auto mx-4" src={assets.phonepe_logo} alt="PhonePe" />
            </div>

            <div
              onClick={() => setPaymentMethod('razorpay')}
              className="flex items-center gap-3 border p-2 px-3 cursor-pointer"
            >
              <p
                className={`min-w-3.5 h-3.5 border rounded-full ${
                  paymentMethod === 'razorpay' ? 'bg-green-400' : ''
                }`}
              />
              <img className="h-6 w-auto mx-4" src={assets.paytm_logo} alt="Paytm" />
            </div>

            <div
              onClick={() => setPaymentMethod('cod')}
              className="flex items-center gap-3 border p-2 px-3 cursor-pointer"
            >
              <p
                className={`min-w-3.5 h-3.5 border rounded-full ${
                  paymentMethod === 'cod' ? 'bg-green-400' : ''
                }`}
              />
              <p className="text-gray-500 text-sm font-medium mx-4">CASH ON DELIVERY</p>
            </div>
          </div>

          {requiresUpiId && (
            <div className="mt-4">
              <label htmlFor="upiId" className="block text-sm font-medium text-gray-700 mb-1">
                UPI ID
              </label>
              <input
                id="upiId"
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="example@oksbi"
                className="border border-gray-300 rounded py-2 px-3 w-full"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your UPI ID and confirm to place the order.
              </p>
            </div>
          )}

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