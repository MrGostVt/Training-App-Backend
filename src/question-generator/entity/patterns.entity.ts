import { QuestionLevel } from "src/common/enums/QuestionLevel.enum";
import { QuestionType } from "src/common/enums/QuestionType.enum";
import { ThemeEntity } from "src/theme/entity/theme.entity";
import { UserEntity } from "src/user/entity/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({name: 'Question_Generator_Patterns'})
export class PatternsEntity{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({unique: true, type:'varchar'})
    pattern: string; 
    
    @Column({type: 'enum', enum: QuestionLevel, enumName: 'QuestionLevel', default: QuestionLevel.easy})
    level: QuestionLevel;

    @Column({name: 'max_points', type: 'int'})
    maxPoints: number;

    @Column({type: 'enum', enum: QuestionType, enumName: 'QuestionType', default: QuestionType.default})
    type: QuestionType;

    @ManyToOne(() => ThemeEntity, (theme: ThemeEntity) => theme.generationPatterns)
    theme: ThemeEntity;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}