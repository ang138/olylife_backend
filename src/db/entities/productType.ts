import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export default class ProductType{
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string
}