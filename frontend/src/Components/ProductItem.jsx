import PropTypes from 'prop-types';
import { useContext } from 'react';
import { ShopContext } from '../Context/ShopContext';
import { Link } from 'react-router-dom';

const ProductItem = ({ id, image, name, price }) => {
  const { currency, toggleWishlist, isInWishlist } = useContext(ShopContext);
  const isWishlisted = isInWishlist(id);

  return (
    <div className="relative text-gray-700 cursor-pointer">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleWishlist(id);
        }}
        className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center"
        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <span className={`text-base ${isWishlisted ? 'text-red-500' : 'text-gray-400'}`}>
          ♥
        </span>
      </button>
      <Link to={`/product/${id}`} className="block">
        <div className="overflow-hidden border rounded-lg p-4 shadow-sm  h-[300px]">
        <img
          src={image[0]}
          alt=""
          className="w-full h-48 object-cover mb-2 rounded hover:scale-110 transition ease-in-out duration-500 "
        />
        <p className="pt-3 pb-1 text-sm ">{name}</p>
        <p className="text-sm font-medium">
          {currency}
          {price}
        </p>
        </div>
      </Link>
    </div>
  );
};

// Add prop validation
ProductItem.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  image: PropTypes.arrayOf(PropTypes.string),
  price: PropTypes.number,
};
export default ProductItem;
