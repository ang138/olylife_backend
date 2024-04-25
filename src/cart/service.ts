import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';

import User from 'src/db/entities/user';
import Product from 'src/db/entities/product';
import Cart from '../db/entities/cart';
import CartDto from '../db/dto/cart.dto';
import Address from 'src/db/entities/address';
import Order from 'src/db/entities/order';
import { Client, TextMessage } from '@line/bot-sdk';
import OrderProduct from 'src/db/entities/orderProduct';

@Injectable()
export default class Service {
  private readonly client: Client;

  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderProduct)
    private readonly orderProductRepository: Repository<OrderProduct>,
  ) {
    this.client = new Client({
      channelAccessToken:
        'xc+48GwtvCGwhhSiNXqQvUXc8glct4ThzIBeGZhBvfEZ+x8Zyu/y8FJR2ATFlILw+cZHNeVEIj9aLnMZoIz+XvFvwtksDXHvEdCs2Ox3E5akx5Sh+BZHVvIUES5Sahw89akLZyCjSDgpC6dVJFb7uQdB04t89/1O/w1cDnyilFU=',
      channelSecret: '82a86f11139f7a0d0eb77ec592be685e',
    });
  }

  async showCart(userId: number) {
    const product = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndMapMany(
        'product.carts', // สร้าง property ให้ entity Product เพื่อเก็บข้อมูลของ product_images
        'cart',
        'cart',
        'product.id = cart.productId',
      )
      .leftJoinAndMapMany(
        'product.product_images', // สร้าง property ให้ entity Product เพื่อเก็บข้อมูลของ product_images
        'product_image',
        'product_image',
        'product.id = product_image.productId',
      )
      .leftJoinAndMapMany(
        'product.product_types',
        'product_type',
        'product_type',
        'product.typeId = product_type.id',
      )
      .select([
        'product.id',
        'product.name',
        'product.typeId',
        'product.price',
        'product.amount',
        'product_type.name',
        'cart',
      ])
      .addSelect([
        'product_image.id AS product_image_id',
        'product_image.id',
        'product_image.filename',
        'product_image.path',
      ])
      .where('cart.userId = :userId', { userId })
      .getMany();

    product.forEach((product) => {
      product.product_images.forEach((image) => {
        image.path = `data:image/jpeg;base64,${image.path.toString('base64')}`;
      });
    });

    return product;
  }

  async getCountInCart(userId: number) {
    const cartItems = await this.cartRepository.find({ where: { userId } });
    const itemCount = cartItems.length; // นับจำนวนรายการในตะกร้า
    return itemCount; // ส่งคืนจำนวนรายการและรายการตะกร้า
  }

  async getCart(token: string) {
    // ถอดรหัส token เพื่อให้ได้ payload
    const decodedToken: any = jwt.decode(token);

    // ตรวจสอบว่ามี 'id' property ใน decoded token หรือไม่
    if (decodedToken && decodedToken.id) {
      // ถ้ามี 'id' ดำเนินการต่อโดยใช้ 'id' เพื่อดึงข้อมูลผู้ใช้
      const cart = await this.cartRepository
        .createQueryBuilder('cart')
        .select(['cart'])
        .where('cart.userId = :uid', { uid: decodedToken.id })
        .getMany();
      return cart;
    } else {
      // ถ้าไม่มี 'id' property, โยน UnauthorizedException
      throw new UnauthorizedException('Invalid token or user ID.');
    }
  }

  async addProductToCart(productId: number, userId: number, cartDto: CartDto) {
    const newQuantity = cartDto.quantity;
    let cartItem;

    if (newQuantity <= 0) {
      console.log('จำนวนสินค้าต้องมากกว่าศูนย์');
      return {
        message: 'จำนวนสินค้าต้องมากกว่าศูนย์',
      };
    }

    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      return {
        message: 'ไม่พบสินค้า',
      };
    }

    if (newQuantity > product.amount) {
      console.log('จำนวนสินค้าไม่เพียงพอ');
      return {
        message: 'จำนวนสินค้าไม่เพียงพอ',
      };
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      return {
        message: 'ไม่พบผู้ใช้',
      };
    }

    const existingCartItem = await this.cartRepository.findOne({
      where: { productId, userId },
    });

    if (existingCartItem) {
      // Update quantity
      existingCartItem.quantity += newQuantity;

      if (existingCartItem.quantity <= 0) {
        // Remove item if quantity becomes zero or negative
        await this.cartRepository.remove(existingCartItem);
      } else {
        // Update price based on the new quantity
        existingCartItem.price = existingCartItem.quantity * product.price;
        await this.cartRepository.save(existingCartItem);
      }
      cartItem = existingCartItem;
    } else {
      // If the item does not exist, create a new one
      const cartItem = new Cart();
      cartItem.productId = productId;
      cartItem.quantity = newQuantity;
      cartItem.userId = userId;
      cartItem.price = newQuantity * product.price;
      await this.cartRepository.save(cartItem);
    }

    // Subtract newQuantity from product amount
    product.amount -= newQuantity;
    await this.productRepository.save(product);

    return {
      message: 'เพิ่มตะกร้าสินค้าเรียบร้อย',
      cartItem,
    };
  }

  async addAmount(cartId: number, productId: number, userId: number) {
    const cart = await this.cartRepository.findOne({
      where: { id: cartId, productId, userId }, // เพิ่มเงื่อนไข userId
    });

    if (!cart) {
      return {
        message: 'ไม่พบตะกร้าสินค้าของผู้ใช้',
      };
    }

    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      return {
        message: 'ไม่พบสินค้า',
      };
    }

    // ตรวจสอบว่ามีจำนวนสินค้าพอในตาราง product หรือไม่
    if (product.amount <= 0) {
      return {
        message: 'สินค้าไม่เพียงพอ',
      };
    }

    // เพิ่มจำนวนสินค้าที่ต้องการ
    cart.quantity += 1;

    // คำนวณราคารวม
    cart.price += product.price;

    // บันทึกการเปลี่ยนแปลงลงในฐานข้อมูล
    await this.cartRepository.save(cart);

    // ลดจำนวนสินค้าในตาราง product
    product.amount -= 1;
    await this.productRepository.save(product);

    return 'เพิ่มจำนวนสินค้าในตะกร้าเรียบร้อย';
  }

  async reduceAmount(cartId: number, productId: number, userId: number) {
    const cart = await this.cartRepository.findOne({
      where: { id: cartId, productId, userId }, // เพิ่มเงื่อนไข userId
    });

    if (!cart) {
      return {
        message: 'ไม่พบตะกร้าสินค้าของผู้ใช้',
      };
    }

    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      return {
        message: 'ไม่พบสินค้า',
      };
    }

    // ตรวจสอบว่าสินค้าในตะกร้ามีจำนวนน้อยกว่าหรือเท่ากับ 1 หรือไม่
    if (cart.quantity <= 1) {
      // ลบรายการออกจากตะกร้า
      await this.cartRepository.remove(cart);

      product.amount += 1;
      await this.productRepository.save(product);

      return 'ลดจำนวนสินค้าในตะกร้าเรียบร้อยและลบรายการออกจากตะกร้า';
    }

    const totalPrice = cart.price - product.price;

    // ลดจำนวนสินค้าที่ต้องการ
    cart.quantity -= 1;
    cart.price = totalPrice;

    // บันทึกการเปลี่ยนแปลงลงในฐานข้อมูล
    await this.cartRepository.save(cart);

    product.amount += 1;
    await this.productRepository.save(product);

    return 'ลดจำนวนสินค้าในตะกร้าเรียบร้อย';
  }

  async removeCart(cartId: number, productId: number, userId: number) {
    const cart = await this.cartRepository.findOne({
      where: { id: cartId, userId }, // เพิ่มเงื่อนไข userId
    });

    if (!cart) {
      return {
        message: 'ไม่พบตะกร้าสินค้าของผู้ใช้',
      };
    }

    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      return {
        message: 'ไม่พบสินค้า',
      };
    }

    // ลบตะกร้าสินค้าจากฐานข้อมูล
    await this.cartRepository.remove(cart);

    product.amount += cart.quantity;
    await this.productRepository.save(product);

    return 'ลบตะกร้าสินค้าเรียบร้อย';
  }

  // async orderProduct(
  //   cartId: number,
  //   userId: number,
  //   addressId: number,
  //   buyType: string,
  // ) {
  //   const cart = await this.cartRepository.findOne({
  //     where: { id: cartId, userId: userId }, // เพิ่มเงื่อนไข userId
  //   });

  //   if (!cart) {
  //     return {
  //       message: 'ไม่พบตะกร้าสินค้าของผู้ใช้',
  //     };
  //   }

  //   const address = await this.addressRepository.findOne({
  //     where: { id: addressId, userId: userId },
  //   });

  //   if (!address) {
  //     return {
  //       message: 'ไม่พบที่อยู่ของผู้ใช้',
  //     };
  //   }

  //   const user = await this.userRepository.findOne({
  //     where: { id: userId },
  //   });

  //   if (!user) {
  //     return {
  //       message: 'ไม่พบชื่อผู้ใช้',
  //     };
  //   }

  //   const order = new Order();
  //   order.userId = userId;
  //   order.addressId = addressId;
  //   order.productId = cart.productId;
  //   order.totalAmount = cart.quantity;
  //   order.totalPrice = cart.price;
  //   order.status = 1;
  //   order.buyType = buyType;

  //   try {
  //     await this.orderRepository.save(order);

  //     await this.cartRepository.delete({ id: cartId });

  //     // เรียกใช้ฟังก์ชั่น ส่งการแจ้งเตือนไปที่ LINE
  //     const userLineId = 'U25646899d34e99f090133b6bae2052b5';

  //     const welcomeMessage = `!! คำสั่งซื้อ ---> คุณ ${user.name} ได้ทำการสั่งสินค้า หมายเลขคำสั่งซื้อ OL000000${order.id} จำนวน ${order.totalAmount} ชิ้น ราคารวม ${order.totalPrice} บาท`;
  //     await this.sendMessage(userLineId, welcomeMessage);

  //     return 'เพิ่มตะกร้าสินค้าเรียบร้อย';
  //   } catch (error) {
  //     console.error('Error creating order:', error);
  //     return {
  //       message: 'Failed to create order',
  //     };
  //   }
  // }

  async orderProduct(
    cartId: number[],
    userId: number,
    addressId: number,
    buyType: string,
  ) {
    const shippingPrice = 50;
    const carts = await this.cartRepository.find({
      where: { id: In(cartId), userId: userId }, // เพิ่มเงื่อนไข userId และใช้ In() เพื่อให้สามารถรับหลายค่าได้
    });

    if (!carts.length) {
      return {
        message: 'ไม่พบตะกร้าสินค้าของผู้ใช้',
      };
    }

    const address = await this.addressRepository.findOne({
      where: { id: addressId, userId: userId },
    });

    if (!address) {
      return {
        message: 'ไม่พบที่อยู่ของผู้ใช้',
      };
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      return {
        message: 'ไม่พบชื่อผู้ใช้',
      };
    }

    try {
      const order = new Order();
      order.userId = userId;
      order.addressId = addressId;
      // order.totalPrice = ;
      order.status = 1;
      order.buyType = buyType;

      let shippingPriceAdded = false; // เพิ่มตัวแปรเพื่อตรวจสอบว่า shippingPrice ถูกเพิ่มไปแล้วหรือยัง

      order.totalPrice = carts.reduce((total, cart) => {
        let price = cart.price;

        // เพิ่ม shippingPrice เฉพาะรอบแรกเท่านั้น
        if (!shippingPriceAdded) {
          price += shippingPrice;
          shippingPriceAdded = true;
        }

        return total + price;
      }, 0);

      const savedOrder = await this.orderRepository.save(order);

      for (const cart of carts) {
        // เพิ่มสินค้าลงใน order_product
        await this.orderProductRepository
          .createQueryBuilder()
          .insert()
          .into(OrderProduct)
          .values({
            orderId: savedOrder.id,
            productId: cart.productId,
            totalAmount: cart.quantity,
            totalPrice: cart.price,
            reviewStatus: 1,
          })
          .execute();
      }

      await this.cartRepository.delete({ id: In(cartId) });

      // เรียกใช้ฟังก์ชั่น ส่งการแจ้งเตือนไปที่ LINE
      const userLineId = 'U25646899d34e99f090133b6bae2052b5';

      const welcomeMessage = `!! คำสั่งซื้อ ---> คุณ ${
        user.name
      } ได้ทำการสั่งสินค้า ${carts.length} รายการ หมายเลขคำสั่งซื้อ OL000000${
        order.id
      } ราคารวม ${carts.reduce(
        (total, cart) => total + cart.price + shippingPrice,
        0,
      )} บาท`;
      await this.sendMessage(userLineId, welcomeMessage);

      return 'เพิ่มตะกร้าสินค้าเรียบร้อย';
    } catch (error) {
      console.error('Error creating order:', error);
      return {
        message: 'Failed to create order',
      };
    }
  }

  async getOrderAll() {
    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndMapMany(
        'order.order_products', 
        'order_product',
        'order_product',
        'order.id = order_product.orderId',
      )
      .leftJoinAndMapMany(
        'order_product.product', // เปลี่ยนจาก 'product' เป็น 'product' (ตัวแปรที่ใช้ใน LEFT JOIN) 
        'product',
        'product',
        'order_product.productId = product.id', // เปลี่ยนจาก 'order.productId' เป็น 'order_product.productId'
      )
      .leftJoinAndMapMany(
        'order.address', 
        'address',
        'address',
        'order.addressId = address.id',
      )
      .leftJoinAndMapMany(
        'product.product_images', 
        'product_image',
        'product_image',
        'product.id = product_image.productId',
      )
      .leftJoinAndMapOne( // ใช้ leftJoinAndMapOne เนื่องจากต้องการข้อมูลเพียงหนึ่ง record
        'product.type', // ใช้ 'product_type' แทน 'product_types' เนื่องจากชื่อไม่ถูกต้อง
        'product_type',
        'product_type',
        'product.typeId = product_type.id',
      )
      .select([
        'product.id',
        'product.name',
        'product.price',
        'product_type.id',
        'product_type.name',
        'order',
        'order_product',
        'address',
      ])
      .addSelect([
        'product_image.id AS product_image_id',
        'product_image.id',
        'product_image.filename',
        'product_image.path',
      ])
      .orderBy('order.id', 'DESC')
      .getMany();

    return orders;
}


  async getOrderById(userId: number) {
    const product = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndMapMany(
        'order.order_products', // สร้าง property ให้ entity Product เพื่อเก็บข้อมูลของ product_images
        'order_product',
        'order_product',
        'order.id = order_product.orderId',
      )
      .leftJoinAndMapMany(
        'order_product.products', // สร้าง property ให้ entity Product เพื่อเก็บข้อมูลของ product_images
        'product',
        'product',
        'order_product.productId = product.id',
      )
      .leftJoinAndMapMany(
        'product.product_images', // สร้าง property ให้ entity Product เพื่อเก็บข้อมูลของ product_images
        'product_image',
        'product_image',
        'product.id = product_image.productId',
      )
      .leftJoinAndMapMany(
        'product.product_types',
        'product_type',
        'product_type',
        'product.typeId = product_type.id',
      )
      .select([
        'product.id',
        'product.name',
        'product.typeId',
        'product_type.name',
        'order',
        'order_product',
      ])
      .addSelect([
        'product_image.id AS product_image_id',
        'product_image.id',
        'product_image.filename',
        'product_image.path',
      ])
      .where('order.userId = :userId', { userId })
      .getMany();

    return product;
  }

  async takingOrders(orderId: number) {
    try {
      await this.orderRepository
        .createQueryBuilder()
        .update(Order)
        .set({ status: 2 })
        .where('id = :id', { id: orderId })
        .execute();

      console.log('Transaction committed.');

      return `รับออเดอร์เรียบร้อย`;
    } catch (error) {
      console.error('Error updating product and images:', error);

      throw new Error('Failed to update product and images');
    }
  }

  async ordersSuccess(orderId: number) {
    try {
      await this.orderRepository
        .createQueryBuilder()
        .update(Order)
        .set({ status: 3 })
        .where('id = :id', { id: orderId })
        .execute();

      console.log('Transaction committed.');

      return `รับออเดอร์เรียบร้อย`;
    } catch (error) {
      console.error('Error updating product and images:', error);

      throw new Error('Failed to update product and images');
    }
  }

  async confirmOrder(orderId: number) {
    try {
      await this.orderRepository
        .createQueryBuilder()
        .update(Order)
        .set({ status: 4 })
        .where('id = :id', { id: orderId })
        .execute();

      console.log('Transaction committed.');

      return `รับสินค้าเรียบร้อย`;
    } catch (error) {
      console.error('Error updating product and images:', error);

      throw new Error('Failed to update product and images');
    }
  }

  async getReviewOrder(orderId: number) {
    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndMapMany(
        'order.products', // สร้าง property ให้ entity Product เพื่อเก็บข้อมูลของ product_images
        'product',
        'product',
        'order.productId = product.id',
      )
      .leftJoinAndMapMany(
        'product.reviews', // สร้าง property ให้ entity Product เพื่อเก็บข้อมูลของ product_images
        'review',
        'review',
        'product.id = review.productId',
      )
      .select(['product.id', 'order.id', 'review'])
      .where('order.id = :orderId', { orderId })
      .getOne();

    return orders;
  }

  // ส่งการแจ้งเตือนไปที่ LINE
  async sendMessage(userId: string, message: string): Promise<any> {
    const textMessage: TextMessage = {
      type: 'text',
      text: message,
    };

    return this.client.pushMessage(userId, textMessage);
  }
}
