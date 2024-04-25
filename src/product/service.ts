import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import * as fs from 'fs/promises';

import Product from '../db/entities/product';
import ProductType from '../db/entities/productType';
import ProductImage from '../db/entities/productImage';
import ProductTypeDto from '../db/dto/productType.dto';
import ProductDto from '../db/dto/product.dto';

@Injectable()
export default class Service {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductType)
    private readonly productTypeRepository: Repository<ProductType>,
    @InjectRepository(ProductImage)
    private fileRepository: Repository<ProductImage>,
  ) {}

  // เพิ่มสินค้าและรูปภาพ
  async addProductAndImages(
    productDto: ProductDto,
    files: Express.Multer.File[],
  ) {
    return this.productRepository.manager.transaction(
      async (transactionalEntityManager) => {
        try {
          type ProductPartialEntity = DeepPartial<Product>;

          const partialProduct: ProductPartialEntity = productDto;

          // Insert products
          const productResult = await transactionalEntityManager
            .createQueryBuilder()
            .insert()
            .into(Product)
            .values(partialProduct)
            .execute();

          const productId = productResult.identifiers[0].id;

          // Insert product images
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
            await transactionalEntityManager
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

          // Rollback the transaction explicitly
          await transactionalEntityManager.query('ROLLBACK');

          console.log('Transaction rolled back.');

          throw new Error('Failed to add product and images');
        }
      },
    );
  }

  // อัปเดตสินค้า
  async updateProductAndImages(
    productId: number,
    productDto: ProductDto,
    files: Express.Multer.File[],
  ) {
    return this.productRepository.manager.transaction(
      async (transactionalEntityManager) => {
        try {
          // Update product
          await transactionalEntityManager
            .createQueryBuilder()
            .update(Product)
            .set(productDto)
            .where('id = :id', { id: productId })
            .execute();

          // Update product images if new files are provided
          if (files && files.length > 0) {
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

            // Check if there are valid images to update
            if (filteredProductImages.length > 0) {
              // Update existing product images
              await Promise.all(
                filteredProductImages.map(async (image) => {
                  await transactionalEntityManager
                    .createQueryBuilder()
                    .update(ProductImage)
                    .set(image)
                    .where('productId = :productId', { productId: productId })
                    .execute();
                }),
              );
            }
          }

          console.log('Transaction committed.');

          return `อัปเดตข้อมูล Product เรียบร้อย`;
        } catch (error) {
          console.error('Error updating product and images:', error);

          // Rollback the transaction explicitly
          await transactionalEntityManager.query('ROLLBACK');

          console.log('Transaction rolled back.');

          throw new Error('Failed to update product and images');
        }
      },
    );
  }

  async updateProductData(productId: number, productDto: ProductDto) {
    try {
      type ProductPartialEntity = DeepPartial<Product>;
      const partialProduct: ProductPartialEntity = productDto;

      await this.productRepository
        .createQueryBuilder()
        .update(Product)
        .set(partialProduct)
        .where('id = :id', { id: productId })
        .execute();

      console.log('Transaction committed.');

      return `อัปเดตข้อมูล Product เรียบร้อย`;
    } catch (error) {
      console.error('Error updating product and images:', error);

      throw new Error('Failed to update product and images');
    }
  }

  // แสดงสินค้าทั้งหมด / ตามไอดี
  async getProductAll(pagenum: number): Promise<{
    totalPages: number;
    count: number;
    pagenum: number;
    products: Product[];
  }> {
    const itemsPerPage = 5;
    const skip = (pagenum - 1) * itemsPerPage;
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndMapMany(
        'product.product_images',
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
      .orderBy('product.id', 'DESC') // คำนวณข้อมูลล่าสุดก่อนแล้วค่อยข้ามข้อมูลและเลือกข้อมูล
      .select([
        'product.id',
        'product.name',
        'product.detail',
        'product.ingredient',
        'product.how_to_use',
        'product.typeId',
        'product.price',
        'product.amount',
        'product_type.name',
      ])
      .addSelect([
        'product_image.id AS product_image_id',
        'product_image.filename',
        'product_image.path',
      ])
      .skip(skip) // ข้ามข้อมูลตามหน้า
      .take(itemsPerPage)
      .getMany();

    const count = await this.productRepository.count();
    const totalPages = Math.ceil(count / itemsPerPage);

    products.forEach((product) => {
      product.product_images.forEach((image) => {
        image.path = `data:image/jpeg;base64,${image.path.toString('base64')}`;
      });
    });

    return {
      totalPages,
      count,
      pagenum,
      products,
    };
  }

  async getProductAllTest(): Promise<Product[]> {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndMapMany(
        'product.product_images',
        'product_image',
        'product_image',
        'product.id = product_image.productId',
      )
      .select([
        'product.id',
        'product.name',
        'product.detail',
        'product.typeId',
        'product.price',
        'product.amount',
      ])
      .addSelect([
        'product_image.id AS product_image_id',
        'product_image.filename',
      ])
      .orderBy('product.create_at', 'DESC') // Assuming you have a createdAt column
      .getMany();

    return products;
  }

  async getProductById(pId: number) {
    const product = await this.productRepository
      .createQueryBuilder('product')
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
        'product.detail',
        'product.ingredient',
        'product.how_to_use',
        'product.typeId',
        'product.price',
        'product.amount',
        'product_type.name',
      ])
      .addSelect([
        'product_image.id AS product_image_id',
        'product_image.id',
        'product_image.filename',
        'product_image.path',
      ])
      .where('product.id = :pId', { pId: pId })
      .orderBy('product_image.id', 'ASC')
      .getMany();

    return product;
  }

  // ประเภทสินค้า
  async createProductType(productTypeDto: ProductTypeDto) {
    await this.productTypeRepository
      .createQueryBuilder()
      .insert()
      .into(ProductType)
      .values(productTypeDto)
      .execute();

    return `เพิ่มข้อมูลเรียบร้อย`;
  }

  async getProductType() {
    const type = await this.productTypeRepository
      .createQueryBuilder('product_type')
      .select(['product_type'])
      .getMany();
    return type;
  }

  async getProductByType(tId: number) {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndMapMany(
        'product.product_images',
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
        'product.detail',
        'product.ingredient',
        'product.how_to_use',
        'product.typeId',
        'product.price',
        'product.amount',
        'product_type.name',
      ])
      .addSelect([
        'product_image.id AS product_image_id',
        'product_image.filename',
        'product_image.path',
      ])
      .where('product.typeId = :tId', { tId })
      .orderBy('product.id', 'DESC')
      .getMany();

    products.forEach((product) => {
      product.product_images.forEach((image) => {
        image.path = `data:image/jpeg;base64,${image.path.toString('base64')}`;
      });
    });

    return products
  }

  async getHealthCareProducts() {
    const product = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndMapMany(
        'product.product_images', // สร้าง property ให้ entity Product เพื่อเก็บข้อมูลของ product_images
        'product_image',
        'product_image',
        'product.id = product_image.productId',
      )
      .select([
        'product.id',
        'product.name',
        'product.detail',
        'product.ingredient',
        'product.how_to_use',
        'product.typeId',
        'product.price',
        'product.amount',
      ])
      .addSelect([
        'product_image.id AS product_image_id',
        'product_image.filename',
        'product_image.path',
      ])
      .where('product.typeId = 1')
      .orderBy('product.id', 'DESC')
      .getMany();

    return product;
  }

  async getDietarySupplementProducts() {
    const product = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndMapMany(
        'product.product_images', // สร้าง property ให้ entity Product เพื่อเก็บข้อมูลของ product_images
        'product_image',
        'product_image',
        'product.id = product_image.productId',
      )
      .select([
        'product.id',
        'product.name',
        'product.detail',
        'product.ingredient',
        'product.how_to_use',
        'product.typeId',
        'product.price',
        'product.amount',
      ])
      .addSelect([
        'product_image.id AS product_image_id',
        'product_image.filename',
        'product_image.path',
      ])
      .where('product.typeId = 2')
      .orderBy('product.id', 'DESC')
      .getMany();

    return product;
  }

  // ลบสินค้า
  async deleteProduct(id: number) {
    return this.productRepository.manager.transaction(
      async (transactionalEntityManager) => {
        try {
          await transactionalEntityManager
            .createQueryBuilder()
            .delete()
            .from(Product)
            .where('product.id = :id', { id })
            .execute();
          // }
          // for (const id of ids) {
          await transactionalEntityManager
            .createQueryBuilder() // เริ่ม query builder ใหม่ที่นี่
            .delete()
            .from(ProductImage)
            .where('productId = :id', { id })
            .execute();
        } catch (error) {
          console.error('Error adding product and images:', error);

          await transactionalEntityManager.query('ROLLBACK');

          console.log('Transaction rolled back.');

          throw new Error('Failed to add product and images');
        }
      },
    );
  }
}
