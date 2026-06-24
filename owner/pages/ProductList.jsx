import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService, firestoreService } from '@core/services/firebaseService';
import toast from 'react-hot-toast';
import { Search, Filter, Plus, Edit, Trash2, Eye, MoreVertical } from 'lucide-react';

export default function OwnerProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const currentUser = authService.getCurrentUser() || JSON.parse(sessionStorage.getItem('currentUser'));
  const ownerId = currentUser?.uid || 'anonymous';

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await firestoreService.getProducts({ ownerId });
      setProducts(data);
    } catch (error) {
      toast.error('Failed to fetch products');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    fetchProducts();
  }, [ownerId]);

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'apartment', name: 'Apartment' },
    { id: 'villa', name: 'Villa' },
    { id: 'commercial', name: 'Commercial' },
    { id: 'land', name: 'Land' },
    { id: 'studio', name: 'Studio' },
  ];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await firestoreService.deleteProduct(productId);
        setProducts(products.filter((p) => p.id !== productId));
        toast.success('Product deleted successfully');
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  const handleToggleStatus = async (productId) => {
    const product = products.find(p => p.id === productId);
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    try {
      await firestoreService.updateProduct(productId, { status: newStatus });
      setProducts(
        products.map((p) =>
          p.id === productId
            ? { ...p, status: newStatus }
            : p
        )
      );
      toast.success(`Product ${newStatus === 'active' ? 'shown' : 'hidden'}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
            <Link
              to="/owner/add-product"
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
              <div className="relative">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
                <span
                  className={`absolute top-3 right-3 px-2 py-1 text-xs font-medium rounded-full ${
                    product.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {product.status}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-primary-600">
                    ${product.price.toLocaleString()}
                  </span>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">⭐ {product.rating}</span>
                    <span>({product.reviews})</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <span>{product.specifications.bedrooms} bed</span>
                  <span>{product.specifications.bathrooms} bath</span>
                  <span>{product.specifications.area} sqft</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Link
                    to={`/owner/edit-product/${product.id}`}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-all"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </Link>
                  <button
                    onClick={() => handleToggleStatus(product.id)}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    <span>{product.status === 'active' ? 'Hide' : 'Show'}</span>
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found</p>
          </div>
        )}
      </main>
    </div>
  );
}
