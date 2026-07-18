Zyntra

Zyntra is a small e-commerce frontend built with React and Vite, using TailwindCSS for styling and React Router for page navigation. This README explains the project structure, local setup, scripts, and deployment notes.

Project status: UI-focused frontend — ready for local development and build for production.

Tech stack:

    React 18
    Vite
    TailwindCSS
    React Router DOM
    React Toastify

Contents

    Installation: How to get the project running locally
    File structure: High level overview of the repository layout
    Scripts: npm scripts available from package.json
    Deployment: Notes for building and deploying (Vercel, Netlify, etc.)
    Contributing & License

Requirements

    Node.js 16+ (LTS recommended)
    npm (comes with Node) or yarn

Quick Setup

    Clone the repo:

git clone https://github.com/Jesukhamrui/Zyntra.git
cd Zyntra

    Install dependencies:

npm install

    Run development server:

npm run dev

    Build for production:

npm run build

    Preview the production build locally:

npm run preview

Available Scripts

    npm run dev / npm start: Runs the Vite dev server.
    npm run build: Builds the production bundle using Vite.
    npm run preview: Serves the built production bundle locally for testing.
    npm run lint: Runs ESLint across the project.

Repository Structure (key files & folders)

Top-level files

    package.json: project metadata and npm scripts
    vite.config.js: Vite configuration
    tailwind.config.js: Tailwind configuration
    postcss.config.js: PostCSS configuration
    eslint.config.js: ESLint configuration
    index.html: Vite HTML entry
    README.md: this file

src/ (main source)

    main.jsx - React entry file
    App.jsx - Application routes and layout
    index.css, App.css - global styles
    assets/ - images and asset helpers
    Components/ - reusable React components (Navbar, Footer, etc.)
    Context/ShopContext.jsx - React context for shop state
    Pages/ - route pages (Home, Collection, Product, Cart, Orders, etc.)

Full repository tree:

.git/
.gitattributes
.gitignore
eslint.config.js
index.html
LICENSE
node_modules/
package-lock.json
package.json
postcss.config.js
README.md
src/
	App.css
	App.jsx
	assets/
		about_img.png
		assets.js
		bin_icon.png
		cart_icon.png
		contact_img.png
		cross_icon.png
		dropdown_icon.png
		exchange_icon.png
		hero_img.png
		lo.png
		logo.png
		menu_icon.png
		profile_icon.png
		p_img1.png
		p_img2.png
		p_img2_1.png
		p_img2_2.png
		p_img2_3.png
		p_img2_4.png
		p_img3.png
		p_img4.png
		p_img5.png
		p_img6.png
		p_img7.png
		p_img8.png
		p_img9.png
		p_img10.png
		p_img11.png
		p_img12.png
		p_img13.png
		p_img14.png
		p_img15.png
		p_img16.png
		p_img17.png
		p_img18.png
		p_img19.png
		p_img20.png
		p_img21.png
		p_img22.png
		p_img23.png
		p_img24.png
		p_img25.png
		p_img26.png
		p_img27.png
		p_img28.png
		p_img29.png
		p_img30.png
		p_img31.png
		p_img32.png
		p_img33.png
		p_img34.png
		p_img35.png
		p_img36.png
		p_img37.png
		p_img38.png
		p_img39.png
		p_img40.png
		p_img41.png
		p_img42.png
		p_img43.png
		p_img44.png
		p_img45.png
		p_img46.png
		p_img47.png
		p_img48.png
		p_img49.png
		p_img50.png
		p_img51.png
		p_img52.png
		quality_icon.png
		razorpay_logo.png
		search_icon.png
		star_dull_icon.png
		star_icon.png
		stripe_logo.png
		support_img.png
		admin_assets/
			add_icon.png
			assets.js
			logo.png
			order_icon.png
			parcel_icon.svg
			upload_area.png
	Components/
		BestSeller.jsx
		CartTotal.jsx
		Footer.jsx
		Hero.jsx
		LatestCollection.jsx
		Navbar.jsx
		NewsLetterBox.jsx
		OurPolicies.jsx
		ProductItem.jsx
		RelatedProducts.jsx
		SearchBar.jsx
		Title.jsx
	Context/
		ShopContext.jsx
	index.css
	main.jsx
	Pages/
		About.jsx
		Cart.jsx
		Collection.jsx
		Contact.jsx
		Home.jsx
		Login.jsx
		Orders.jsx
		PlaceOrder.jsx
		Product.jsx
tailwind.config.js
vite.config.js

Routing

    Routing is managed by react-router-dom (v6). Routes are defined in src/App.jsx.

Styling

    TailwindCSS is used for utility-first styling. Configuration is in tailwind.config.js.

Deployment Notes

    This project builds with Vite. For static hosting (Vercel, Netlify, GitHub Pages), use npm run build and deploy the contents of the dist/ directory.
    Ensure your host preserves case-sensitivity for import paths; use consistent casing (Pages vs pages) — this repo uses Pages for page components.

Environment variables

    If you add environment variables, follow Vite's .env naming conventions (e.g., VITE_API_URL) and do not commit sensitive keys.

Contributing

    Feel free to open issues or PRs. Keep changes focused and include a short description of the problem and how to test the fix.

License

    See the LICENSE file at the repo root.

If you want, I can also:

    add a small CONTRIBUTING.md or PR template,
    run the dev server and verify everything works locally,
    or update the README with screenshots and live demo links.

Generated/updated by your assistant.
Features (Frontend)

    Authentication UI: signup/login forms, validation, toast notifications.
    Session management: stores JWT in localStorage, automatic redirect to profile.
    Protected routes: CustomerRoute guards pages for authenticated users.
    Order flow: cart checkout, PlaceOrder with address collection and order submission.
    Location services: GPS lookup with IP fallback and reverse geocoding.
    Payments: UPI ID validation and Cash-on-Delivery support.
    Responsive design using TailwindCSS and accessible components.

Backend Integration

    The frontend calls a small Express.js auth backend under /api.
    Vite is configured to proxy /api to http://localhost:4000 during development (see vite.config.js).
    API base URL can be overridden via VITE_API_BASE_URL environment variable.

How to run (full-stack locally)

    Start backend (from the repository root):

cd backend
npm install
npm run dev

    Start frontend (in a separate terminal):

cd frontend
npm install
npm run dev

The frontend will proxy API calls to the backend at http://localhost:4000.
API Reference (brief)

    POST /api/auth/signup — Create account. Request: { name, email, password }.
    POST /api/auth/login — Authenticate. Request: { email, password }.
    GET /api/auth/me — Get profile. Requires Authorization: Bearer <token>.

For full backend documentation see backend/README.md.
