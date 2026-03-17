import PropTypes from 'prop-types';
import { createContext, useEffect, useState } from 'react';
import { products as initialProducts } from '../assets/assets';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

export const ShopContext = createContext();

const ShopContextProvider = ({ children }) => {
  const currency = '₹';
  const delivery_fee = 10;

  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem('cartItems');
      return savedCart ? JSON.parse(savedCart) : {};
    } catch {
      return {};
    }
  });
  const [products, setProducts] = useState(() => {
    try {
      const savedProducts = localStorage.getItem('products');
      return savedProducts ? JSON.parse(savedProducts) : initialProducts;
    } catch {
      return initialProducts;
    }
  });
  const [orders, setOrders] = useState(() => {
    try {
      const savedOrders = localStorage.getItem('orders');
      return savedOrders ? JSON.parse(savedOrders) : [];
    } catch {
      return [];
    }
  });
  const [wishlistItems, setWishlistItems] = useState(() => {
    try {
      const savedWishlist = localStorage.getItem('wishlistItems');
      return savedWishlist ? JSON.parse(savedWishlist) : [];
    } catch {
      return [];
    }
  });

  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      return Boolean(localStorage.getItem('isAdmin'));
    } catch {
      return false;
    }
  });

  const loginAdmin = (password) => {
    if (password === 'admin123') {
      setIsAdmin(true);
      try {
        localStorage.setItem('isAdmin', '1');
      } catch {
        // localStorage may not be available
      }
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    try {
      localStorage.removeItem('isAdmin');
    } catch {
      // localStorage may not be available
    }
  };

  const navigate = useNavigate();

  useEffect(() => {
    const syncStorageData = (event) => {
      try {
        if (event.key === 'cartItems') {
          setCartItems(event.newValue ? JSON.parse(event.newValue) : {});
        }
        if (event.key === 'wishlistItems') {
          setWishlistItems(event.newValue ? JSON.parse(event.newValue) : []);
        }
        if (event.key === 'orders') {
          setOrders(event.newValue ? JSON.parse(event.newValue) : []);
        }
      } catch {
        // ignore malformed storage values
      }
    };

    window.addEventListener('storage', syncStorageData);
    return () => window.removeEventListener('storage', syncStorageData);
  }, []);

  // Product Management Functions
  const addProduct = (productData) => {
    const newProduct = {
      _id: `product_${Date.now()}`,
      ...productData,
      date: Date.now(),
    };
    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);
    try {
      localStorage.setItem('products', JSON.stringify(updatedProducts));
    } catch (error) {
      console.log('Failed to save products', error);
    }
  };

  const updateProduct = (productId, productData) => {
    const updatedProducts = products.map((product) =>
      product._id === productId ? { ...product, ...productData } : product
    );
    setProducts(updatedProducts);
    try {
      localStorage.setItem('products', JSON.stringify(updatedProducts));
    } catch (error) {
      console.log('Failed to update products', error);
    }
  };

  const deleteProduct = (productId) => {
    const updatedProducts = products.filter((product) => product._id !== productId);
    setProducts(updatedProducts);
    try {
      localStorage.setItem('products', JSON.stringify(updatedProducts));
    } catch (error) {
      console.log('Failed to delete product', error);
    }
  };

  const addToCart = async (itemId, size) => {
    if (!size) {
      toast.error('Please select a size');
      return;
    }

    let cartData = structuredClone(cartItems);

    if (cartData[itemId]) {
      cartData[itemId][size]
        ? (cartData[itemId][size] += 1)
        : (cartData[itemId][size] = 1);
    } else {
      cartData[itemId] = {};
      cartData[itemId][size] = 1;
    }

    setCartItems(cartData);
    try {
      localStorage.setItem('cartItems', JSON.stringify(cartData));
    } catch (error) {
      console.log('Failed to save cart', error);
    }
    toast.success('Item added to cart', {
      autoClose: 1000,
      closeOnClick: true,
      hideProgressBar: true,
      pauseOnHover: false,
    });
  };

  const toggleWishlist = (itemId) => {
    setWishlistItems((prev) => {
      const alreadyInWishlist = prev.includes(itemId);
      const updatedWishlist = alreadyInWishlist
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId];

      try {
        localStorage.setItem('wishlistItems', JSON.stringify(updatedWishlist));
      } catch (error) {
        console.log('Failed to save wishlist', error);
      }

      toast.success(alreadyInWishlist ? 'Removed from wishlist' : 'Added to wishlist', {
        autoClose: 1000,
        closeOnClick: true,
        hideProgressBar: true,
        pauseOnHover: false,
      });

      return updatedWishlist;
    });
  };

  const isInWishlist = (itemId) => wishlistItems.includes(itemId);
  const wishlistProducts = products.filter((product) => wishlistItems.includes(product._id));

  const addOrder = (deliveryInfo, paymentMethod) => {
    let tempOrders = structuredClone(orders);
    let newOrder = [];
    const orderId = `ORD-${Date.now()}`;

    const placedAt = Date.now();

    for (const item in cartItems) {
      for (const size in cartItems[item]) {
        if (cartItems[item][size] > 0) {
          const productData = products.find((p) => p._id === item);
          newOrder.push({
            _id: item,
            name: productData.name,
            image: productData.image[0],
            price: productData.price,
            size,
            quantity: cartItems[item][size],
            date: new Date().toLocaleDateString('en-US', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }),
            time: new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            placedAt,
            orderId,
            deliveryInfo,
            paymentMethod,
            status: 'Order Confirmed',
          });
        }
      }
    }

    const updatedOrders = [...tempOrders, ...newOrder];
    setOrders(updatedOrders);

    try {
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
    } catch (error) {
      console.log('Failed to save orders to localStorage', error);
    }

    setCartItems({});
    try {
      localStorage.setItem('cartItems', JSON.stringify({}));
    } catch (error) {
      console.log('Failed to clear cart in localStorage', error);
    }
    toast.success('Order placed successfully!');
  };

  const updateOrderDeliveryInfo = (orderId, orderDate, orderTime, updates) => {
    const updatedOrders = orders.map((order) => {
      const matchesByOrderId = order.orderId && order.orderId === orderId;
      const matchesByDateTime = !order.orderId && order.date === orderDate && order.time === orderTime;

      if (!matchesByOrderId && !matchesByDateTime) {
        return order;
      }

      return {
        ...order,
        deliveryInfo: {
          ...order.deliveryInfo,
          ...updates,
        },
      };
    });

    setOrders(updatedOrders);

    try {
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
    } catch (error) {
      console.log('Failed to update order delivery info', error);
    }
  };

  const updateOrderPaymentMethod = (orderId, orderDate, orderTime, paymentMethod) => {
    const updatedOrders = orders.map((order) => {
      const matchesByOrderId = order.orderId && order.orderId === orderId;
      const matchesByDateTime = !order.orderId && order.date === orderDate && order.time === orderTime;

      if (!matchesByOrderId && !matchesByDateTime) {
        return order;
      }

      return {
        ...order,
        paymentMethod,
      };
    });

    setOrders(updatedOrders);

    try {
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
    } catch (error) {
      console.log('Failed to update payment method', error);
    }
  };

  const cancelOrder = (orderId, orderDate, orderTime) => {
    const updatedOrders = orders.filter((order) => {
      const matchesByOrderId = order.orderId && order.orderId === orderId;
      const matchesByDateTime = !order.orderId && order.date === orderDate && order.time === orderTime;
      return !(matchesByOrderId || matchesByDateTime);
    });

    setOrders(updatedOrders);

    try {
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
    } catch (error) {
      console.log('Failed to cancel order', error);
    }
  };

  const getCartCount = () => {
    let totalCount = 0;
    for (const item in cartItems) {
      for (const size in cartItems[item]) {
        if (cartItems[item][size] > 0) {
          totalCount += cartItems[item][size];
        }
      }
    }
    return totalCount;
  };

  const updateQuantity = async (itemId, size, quantity) => {
    let cartData = structuredClone(cartItems);
    cartData[itemId][size] = quantity;
    setCartItems(cartData);
    try {
      localStorage.setItem('cartItems', JSON.stringify(cartData));
    } catch (error) {
      console.log('Failed to update cart', error);
    }
  };

  const getWishlistCount = () => wishlistItems.length;

  const getOrderStatus = (placedAtValue, currentTime = Date.now()) => {
    const fallbackTime = currentTime;
    const numericPlacedAt = Number(placedAtValue) || fallbackTime;
    const elapsedMinutes = (currentTime - numericPlacedAt) / (1000 * 60);

    if (elapsedMinutes < 1) return 'Order Confirmed';
    if (elapsedMinutes < 2) return 'Packed';
    if (elapsedMinutes < 3) return 'Shipped';
    if (elapsedMinutes < 5) return 'Out for Delivery';
    return 'Delivered';
  };

  const getCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
      const productInfo = products.find((product) => product._id === item);
      for (const size in cartItems[item]) {
        try {
          if (cartItems[item][size] > 0) {
            totalAmount += productInfo.price * cartItems[item][size];
          }
        } catch (error) {
          console.log('error', error);
        }
      }
    }
    return totalAmount;
  };

  const value = {
    products,
    currency,
    delivery_fee,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    cartItems,
    wishlistItems,
    wishlistProducts,
    addToCart,
    toggleWishlist,
    isInWishlist,
    getWishlistCount,
    getOrderStatus,
    getCartCount,
    updateQuantity,
    getCartAmount,
    addOrder,
    updateOrderDeliveryInfo,
    updateOrderPaymentMethod,
    cancelOrder,
    orders,
    navigate,
    isAdmin,
    loginAdmin,
    logoutAdmin,
    addProduct,
    updateProduct,
    deleteProduct,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

ShopContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ShopContextProvider;
