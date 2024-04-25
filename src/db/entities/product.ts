import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export default class Product{
    [x: string]: any;
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    typeId: number;

    @Column()
    detail: string;
    
    @Column()
    ingredient: string;

    @Column()
    how_to_use: string;

    @Column()
    price: number;

    @Column()
    amount: number;

    @CreateDateColumn()
    create_at: Date;

    @UpdateDateColumn()
    update_at: Date;
}