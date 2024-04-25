import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Review } from 'src/db/entities/review';
import Product from 'src/db/entities/product';
import User from 'src/db/entities/user';
import Order from 'src/db/entities/order';
import OrderProduct from 'src/db/entities/orderProduct';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderProduct)
    private readonly orderProductRepository: Repository<OrderProduct>,
  ) {}

  async addReview(
    productId: number,
    userId: number,
    orderId: number,
    comment: string,
  ) {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      return {
        message: 'Product not found',
      };
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return {
        message: 'User not found',
      };
    }

    // Check if the order exists and its status is not 2
    const order = await this.orderProductRepository.findOne({
      where: { orderId, productId },
    });
    if (!order) {
      return {
        message: 'Order not found',
      };
    }
    if (order.reviewStatus === 2) {
      return {
        message: 'Order cannot be reviewed',
      };
    }

    // Insert review
    await this.reviewRepository
      .createQueryBuilder()
      .insert()
      .into(Review)
      .values({ productId, userId, comment })
      .execute();

    // Update order review status
    order.reviewStatus = 2;
    await this.orderProductRepository.save(order);

    // Check if all orders related to orderId have reviewStatus = 2
    const allOrdersReviewed = await this.orderProductRepository.find({
      where: { orderId },
    });
    const allReviewed = allOrdersReviewed.every(
      (order) => order.reviewStatus === 2,
    );

    if (allReviewed) {
      // Update order status to 4 (completed)
      const orderToUpdate = await this.orderRepository.findOne({
        where: { id: orderId },
      });
      if (orderToUpdate) {
        orderToUpdate.status = 5;
        await this.orderRepository.save(orderToUpdate);
      }
    }

    return {
      message: 'เพิ่มข้อมูลเรียบร้อย',
      Review: await this.reviewRepository
        .createQueryBuilder('review')
        .leftJoinAndMapMany(
          'review.users',
          'user',
          'user',
          'review.userId = user.id',
        )
        .select(['review', 'user.name'])
        .where({ productId })
        .getMany(),
    };
  }

  // async addReview(
  //   productId: number,
  //   userId: number,
  //   orderId: number,
  //   comment: string,
  // ) {
  //   const product = await this.productRepository.findOne({
  //     where: { id: productId },
  //   });
  //   if (!product) {
  //     return {
  //       message: 'Product not found',
  //     };
  //   }

  //   const user = await this.userRepository.findOne({ where: { id: userId } });
  //   if (!user) {
  //     return {
  //       message: 'User not found',
  //     };
  //   }

  //   await this.reviewRepository
  //     .createQueryBuilder()
  //     .insert()
  //     .into(Review)
  //     .values({ productId, userId, comment })
  //     .execute();

  //   const orderProducts = await this.orderProductRepository.find({
  //     where: { orderId: orderId },
  //   });

  //   let totalProductCount = 0;
  //   for (const orderProduct of orderProducts) {
  //     totalProductCount += orderProduct.productId;
  //   }

  //   const reviewedCount = await this.reviewRepository.count({
  //     where: { productId: productId },
  //   });

  //   const remainingReviewCount = totalProductCount - reviewedCount;

  //   const order = await this.orderRepository.findOne({
  //     where: { id: orderId },
  //   });
  //   if (order && remainingReviewCount === 0) {
  //     // อัปเดตสถานะตามที่คุณต้องการ
  //     order.status = 4;
  //     await this.orderRepository.save(order);
  //   }

  //   return {
  //     message: 'เพิ่มข้อมูลเรียบร้อย',
  //     remainingReviewCount: remainingReviewCount,
  //     reviewedCount: reviewedCount,
  //     Review: await this.reviewRepository
  //       .createQueryBuilder('review')
  //       .leftJoinAndMapMany(
  //         'review.users',
  //         'user',
  //         'user',
  //         'review.userId = user.id',
  //       )
  //       .select(['review', 'user.name'])
  //       .where({ productId })
  //       .getMany(),
  //   };
  // }

  async countOrderProducts(orderId: number) {
    return await this.orderProductRepository.count({ where: { orderId } });
  }

  async getReview(productId: number) {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      return {
        message: 'Product not found',
      };
    }
    const reviews = await this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndMapMany(
        'review.users',
        'user',
        'user',
        'review.userId = user.id',
      )
      .select(['review', 'user.name'])
      .where({ productId })
      .orderBy('review.id', 'DESC')
      .getMany();

    if (!reviews) {
      return {
        message: 'Product not found',
      };
    }
    return reviews;
  }
}
