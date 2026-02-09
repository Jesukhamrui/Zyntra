import PropTypes from 'prop-types';
import { createContext, useState } from 'react';
import { products as initialProducts } from '../assets/assets';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

export const ShopContext = createContext();

const ShopContextProvider = ({ children }) => {
  const currency = '₹';
  const delivery_fee = 10;

  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [cartItems, setCartItems] = useState({});
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
  };

  const addOrder = (deliveryInfo, paymentMethod) => {
    let tempOrders = structuredClone(orders);
    let newOrder = [];

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
            deliveryInfo,
            paymentMethod,
            status: 'Ready to ship',
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
    toast.success('Order placed successfully!');
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
    addToCart,
    getCartCount,
    updateQuantity,
    getCartAmount,
    addOrder,
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
