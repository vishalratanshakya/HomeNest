const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Desktop', 'realstate', 'user', 'components', 'UserNavbar.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Wrap in fragment
content = content.replace(
  '  return (\n    <header',
  '  return (\n    <>\n    <header'
);

// 2. Remove mobile menu hamburger
content = content.replace(
  /            <button \n              onClick=\{.*?setShowMobileMenu.*?\}\n              className="md:hidden[\s\S]*?<\/button>/m,
  ''
);

// 3. Unhide auth logic on mobile
content = content.replace(
  '<div className="hidden md:flex items-center">',
  '<div className="flex items-center">'
);

// 4. Update the "Login" button area to include a Vendor button on mobile
const loginBlock = `<div className="flex items-center space-x-4 pl-4 border-l border-slate-100">
                  <Link 
                    to="/auth/login" 
                    className="hidden sm:block px-8 py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-xs font-black rounded-2xl shadow-xl shadow-primary-200 hover:shadow-primary-300 hover:-translate-y-0.5 active:translate-y-0 transition-all uppercase tracking-widest"
                  >
                    Login
                  </Link>
                </div>`;
const newLoginBlock = `<div className="flex items-center space-x-2 md:space-x-4 pl-2 md:pl-4 border-l border-slate-100">
                  <Link 
                    to="/vendor/login" 
                    className="md:hidden px-3 py-2 bg-slate-900 text-white text-[10px] font-black rounded-xl"
                  >
                    Vendor
                  </Link>
                  <Link 
                    to="/auth/login" 
                    className="hidden sm:block px-8 py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-xs font-black rounded-2xl shadow-xl shadow-primary-200 hover:shadow-primary-300 hover:-translate-y-0.5 active:translate-y-0 transition-all uppercase tracking-widest"
                  >
                    Login
                  </Link>
                </div>`;
content = content.replace(loginBlock, newLoginBlock);

// 5. Remove Mobile Menu Modal entirely to prevent bugs
// We'll just remove the `{showMobileMenu && (...)}` block by replacing it with an empty string.
const mobileMenuRegex = /\{\/\* Mobile Menu \*\/\}[\s\S]*?\{\/\* Mobile Search Overlay \*\/\}/m;
content = content.replace(mobileMenuRegex, '{/* Mobile Search Overlay */}');

// 6. Add Bottom Navbar
const bottomNav = `    </header>
    {/* Bottom Mobile Tab Bar */}
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-[100] flex justify-around items-center p-2 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
      {[
        { icon: Home, label: 'Home', path: '/user/home' },
        { icon: Search, label: 'Sell', path: '/user/sale' },
        { icon: Search, label: 'Rent', path: '/user/rent' },
        { icon: MessageSquare, label: 'Contact', path: '/user/contact' }
      ].map((item) => {
        const isActive = location.pathname === item.path || (item.path !== '/user/home' && location.pathname.startsWith(item.path));
        return (
          <Link key={item.label} to={item.path} className={\`flex flex-col items-center p-2 rounded-xl transition-all \${isActive ? 'text-primary-600' : 'text-slate-400'}\`}>
            <item.icon className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
          </Link>
        )
      })}
    </nav>
    </>
  );
}`;

content = content.replace(/    <\/header>\n  \);\n\}/m, bottomNav);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Navbar successfully updated!");
