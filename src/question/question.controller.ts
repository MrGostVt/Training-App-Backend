import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { QuestionService } from './question.service';
import { QuestionDTO } from './dto/question.dto';
import { Access } from 'src/common/decorators/access.decorator';
import { Auth } from 'src/common/decorators/auth.decorator';
import { AccessLevel } from 'src/common/enums/AccessLevel.enum';
import { AnswerDTO } from './dto/answer.dto';
import { ModerationResult } from './dto/moderation-result.dto';
import { UserEntity } from 'src/user/entity/user.entity';
import { User } from 'src/common/decorators/user.decorator';
import { QuestionLevel } from 'src/common/enums/QuestionLevel.enum';
import { GenerationPatternDTO } from '../common/dto/generation-pattern.dto';

@Controller('question')
export class QuestionController {
    constructor(private readonly questionService: QuestionService) {}

    @Auth()
    @Access(AccessLevel.Creator)
    @Post('create')
    async create(@Body() question: QuestionDTO, @User('passport') passport: string, @User('accessLevel') userLevel: AccessLevel){
        return await this.questionService.create(question, passport, userLevel);
    }

    //Find by theme & level & cost and add paging & random choose
    @Auth()
    @Access(AccessLevel.Default)
    @Get('get')
    async get(
        @Query('theme') theme: 'string',
        @User('passport') passport: string,
    ){
        return await this.questionService.get(theme, passport)
    }

    @Auth()
    @Access(AccessLevel.Default)
    @Post('answer')
    async answer(@Body() answers: AnswerDTO, @User('passport') passport: string){
       return await this.questionService.answer(answers, passport);
    }

    @Access(AccessLevel.Moderator)
    @Get('moderating')
    async getModerating(@Query('theme') theme: 'string', @User('passport') passport: string){
        return await this.questionService.getModerating(theme, passport);
    }

    @Access(AccessLevel.Moderator)
    @Post('moderate')
    async moderate(@Body() moderationResult: ModerationResult, @User('passport') passport: string){
        return await this.questionService.moderate(moderationResult, passport);
    }

    
    @Auth()
    @Access(AccessLevel.Admin)
    @Post('create-generation-pattern')
    @HttpCode(HttpStatus.OK)
    async createGenerationPattern(@Body() patternDto: GenerationPatternDTO, @User('passport') passport: string){
        return await this.questionService.createGenerationPattern(patternDto, passport);
    }
}
