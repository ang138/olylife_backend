import {
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductImageService } from './service';

@Controller('product-image')
export class ProductImageController {
  constructor(private readonly productImageService: ProductImageService) {}

  @Post('add/:id')
  @UseInterceptors(FilesInterceptor('files'))
  async addProductImage(
    @Param('id') productId: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.productImageService.addProductImage(productId, files);
  }

  @Patch('update-image/:imageId')
  @UseInterceptors(FilesInterceptor('file'))
  async updateProductImage(
    @UploadedFiles() files: Express.Multer.File[],
    @Param('imageId') imageId: number,
  ) {
    return this.productImageService.updateProductImage(imageId, files);
  }

  @Delete('delete-image/:id')
  async deleteProductImage(@Param('id') id: number) {
    try {
      // เรียกใช้ฟังก์ชันหรือ service ที่ทำหน้าที่ในการลบสินค้า
      await this.productImageService.deleteProductImage(id);
      return { message: 'Product deleted successfully' };
    } catch (error) {
      console.error('Error deleting product:', error);
      throw new Error('Failed to delete product');
    }
  }
}
