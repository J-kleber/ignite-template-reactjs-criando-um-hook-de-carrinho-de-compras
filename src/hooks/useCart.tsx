import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
     
      const newCart = [...cart];

      const {data: stock} = await api.get<Stock>(`stock/${productId}`);
      const existentProduct = newCart.find(product => product.id === productId);
      const quantity = existentProduct ? existentProduct.amount + 1 : 1;

      if (stock.amount < quantity) { 
        toast.error('Quantidade solicitada fora de estoque');
        return;
      } 

      if (existentProduct) {
        existentProduct.amount++;
      } else {
          const {data: product} = await api.get<Product>(`products/${productId}`);
          newCart.push({
            id: product.id,
            amount: 1,
            image: product.image,
            price: product.price,
            title: product.title
          })
        }
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch(e) {
      console.log(e);
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = [...cart];
      const index = newCart.findIndex(product => product.id === productId);
      if (index < 0) {
        toast.error('Erro na remoção do produto');
        return;
      }
      newCart.splice(index, 1);
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }
      const {data: stock} = await api.get<Stock>(`stock/${productId}`);
      if (stock.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      const newCart = cart.map(product => {
        if (product.id === productId) {
          product.amount = amount;
        }
        return product;
      });
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch { 
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
