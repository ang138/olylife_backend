import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs/promises';

import Product from 'src/db/entities/product';
import ProductImage from 'src/db/entities/productImage';
import ProductType from 'src/db/entities/productType';

@Injectable()
export class ProductImageService {
  constructor(
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
  ) {}

  async addProductImage(productId: number, files: Express.Multer.File[]) {
    try {
      const productImages = await Promise.all(
        files.map(async (file) => {
          try {
            const buffer = await fs.readFile(file.path);

            return {
              productId: productId,
              filename: file.filename,
              path: buffer.toString('base64'),
            };
          } catch (error) {
            console.error('Error reading file:', error);
            return null;
          }
        }),
      );

      // Remove entries with null values (files without buffer)
      const filteredProductImages = productImages.filter(
        (image) => image !== null,
      );

      // Check if there are valid images to insert
      if (filteredProductImages.length > 0) {
        await this.productImageRepository
          .createQueryBuilder()
          .insert()
          .into(ProductImage)
          .values(filteredProductImages)
          .execute();

        console.log('Transaction committed.');

        return `เพิ่มข้อมูล Product และ Product Images เรียบร้อย`;
      } else {
        console.error('No valid files to insert.');
        throw new Error('Failed to add product and images');
      }
    } catch (error) {
      console.error('Error adding product and images:', error);

      console.log('Transaction rolled back.');

      throw new Error('Failed to add product and images');
    }
  }

  async updateProductImage(imageId: number, files: Express.Multer.File[]) {
    if (files && files.length > 0) {
      const file = files[0]; // เลือกไฟล์เพียงอันเดียว

      try {
        const buffer = await fs.readFile(file.path);
        const productImage = {
          filename: file.filename,
          path: buffer.toString('base64'),
        };

        // Update existing product image
        await this.productImageRepository
          .createQueryBuilder()
          .update(ProductImage)
          .set(productImage)
          .where('id = :imageId', { imageId })
          .execute();

        console.log('Transaction committed.');
        return `อัปเดตข้อมูล Product เรียบร้อย`;
      } catch (error) {
        console.error('Error reading file:', error);
        return 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล Product';
      }
    }
  }

  async deleteProductImage(id: number) {
    try {
      return this.productImageRepository
        .createQueryBuilder()
        .delete()
        .from(ProductImage)
        .where('product_image.id = :id', { id })
        .execute();
    } catch (error) {
      console.error('Error adding product and images:', error);

      console.log('Transaction rolled back.');

      throw new Error('Failed to add product and images');
    }
  }
}
