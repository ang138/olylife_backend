import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Response as ExpressResponse } from 'express';

import ProductService from './service';
import ProductTypeDto from '../db/dto/productType.dto';
import ProductDto from '../db/dto/product.dto';

@Controller('product')
export default class controller {
  constructor(private readonly productService: ProductService) {}

  @Post('add')
  @UseInterceptors(FilesInterceptor('files'))
  async addProductAndImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() productDto: ProductDto,
  ) {
    return this.productService.addProductAndImages(productDto, files);
  }

  @Patch('update/:id')
  @UseInterceptors(FilesInterceptor('files'))
  async updateProductAndImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() productDto: ProductDto,
    @Param('id') productId: number,
  ) {
    return this.productService.updateProductAndImages(
      productId,
      productDto,
      files,
    );
  }

  @Patch('update-data/:id')
  async updateProductData(
    @Body() productDto: ProductDto,
    @Param('id') productId: number,
  ) {
    return this.productService.updateProductData(productId, productDto);
  }

  @Get('all/:pagenum')
  async getProductAll(
    @Req() req: Request,
    @Res() res: ExpressResponse,
    @Param('pagenum') pagenum: number,
  ) {
    try {
      const products = await this.productService.getProductAll(pagenum);

      if (products) {
        res.send(products);
      } else {
        res.status(400).send({ msg: 'not found' });
      }
    } catch (error) {
      console.error('Error getting product data:', error);
      res.status(500).send({ msg: 'Internal server error' });
    }
  }

  @Get('test')
  async getProductAllTest(@Req() req: Request, @Res() res: ExpressResponse) {
    const products = await this.productService.getProductAllTest();
    // console.log('Products with Data URLs:', products);

    if (products) {
      res.send(products);
    } else {
      res.status(400).send({ msg: 'not found' });
    }
  }

  @Get('product/:pId')
  async getProductById(
    @Param('pId') pId: number,
    @Req() req: Request,
    @Res() res: ExpressResponse,
  ) {
    const productById = await this.productService.getProductById(pId);

    productById.forEach((product) => {
      product.product_images.forEach((image) => {
        image.path = `data:image/jpeg;base64,${image.path.toString('base64')}`;
      });
    });

    if (productById) {
      res.send(productById);
    } else {
      res.status(400).send({ msg: 'not found' });
    }
  }

  @Post('addtype')
  createProductType(@Body() productTypeDto: ProductTypeDto) {
    return this.productService.createProductType(productTypeDto);
  }

  @Get('type')
  getProductType() {
    return this.productService.getProductType();
  }

  @Get('producttype/:tId')
  async findProductByType(
    @Param('tId') tId: number,
    @Req() req: Request,
    @Res() res: ExpressResponse,
  ) {
    const productByType = await this.productService.getProductByType(tId);

    if (productByType) {
      res.send(productByType);
    } else {
      res.status(400).send({ msg: 'not found' });
    }
  }

  @Get('health-care')
  async findHealthCareProducts(
    @Req() req: Request,
    @Res() res: ExpressResponse,
  ) {
    const healthcare = await this.productService.getHealthCareProducts();

    healthcare.forEach((product) => {
      product.product_images.forEach((image) => {
        image.path = `data:image/jpeg;base64,${image.path.toString('base64')}`;
      });
    });

    if (healthcare) {
      res.send(healthcare);
    } else {
      res.status(400).send({ msg: 'not found' });
    }
  }

  @Get('dietary-supplement')
  async findDietarySupplementProducts(
    @Req() req: Request,
    @Res() res: ExpressResponse,
  ) {
    const dietarysupplement =
      await this.productService.getDietarySupplementProducts();

    dietarysupplement.forEach((product) => {
      product.product_images.forEach((image) => {
        image.path = `data:image/jpeg;base64,${image.path.toString('base64')}`;
      });
    });

    if (dietarysupplement) {
      res.send(dietarysupplement);
    } else {
      res.status(400).send({ msg: 'not found' });
    }
  }

  @Delete('delete-products/:id')
  async deleteProduct(@Param('id') id: number) {
    try {
      // เรียกใช้ฟังก์ชันหรือ service ที่ทำหน้าที่ในการลบสินค้า
      await this.productService.deleteProduct(id);
      return { message: 'Product deleted successfully' };
    } catch (error) {
      console.error('Error deleting product:', error);
      throw new Error('Failed to delete product');
    }
  }
}
