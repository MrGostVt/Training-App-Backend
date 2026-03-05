import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, ValidationPipe } from '@nestjs/common';
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
import { CheckModerationDTO } from 'src/common/dto/check-moderation.dto';
import { ThemeParamDTO } from 'src/common/dto/theme-param.dto';
import { GetModeratingDTO } from 'src/common/dto/get-moderating.dto';

@Controller('question')
export class QuestionController {
    constructor(private readonly questionService: QuestionService) {}

    @Auth()
    @Access(AccessLevel.Creator)
    @Post('create')
    async create(@Body() question: QuestionDTO, @User('passport') passport: string, @User('accessLevel') userLevel: AccessLevel){
        return await this.questionService.create(question, passport, userLevel);
    }

    @Auth()
    @Access(AccessLevel.Default)
    @Get('get')
    async get(
        @Query(new ValidationPipe({transform: true})) {theme}: ThemeParamDTO,
        @User('language') language: string,
        @User('passport') passport: string,
    ){
        return await this.questionService.get(theme, language, passport)
    }

    @Auth()
    @Access(AccessLevel.Default)
    @Post('answer')
    async answer(@Body() answers: AnswerDTO, @User('passport') passport: string){
       return await this.questionService.answer(answers, passport);
    }

    @Auth()
    @Access(AccessLevel.Moderator)
    @Get('moderating')
    async getModerating(@Query(new ValidationPipe({transform: true})) {theme, limit}: GetModeratingDTO, @User('passport') passport: string){
        return await this.questionService.getModerating(theme, limit, passport);
    }
    
    @Auth()
    @Access(AccessLevel.Moderator)
    @Get('check-moderator-on-question')
    async checkModerator(@Query(new ValidationPipe({transform: true})) {idlist}: CheckModerationDTO, @User('passport') passport: string){
        return await this.questionService.checkModerator(idlist, passport);
    }

    @Auth()
    @Access(AccessLevel.Moderator)
    @Post('moderate')
    async moderate(@Body() moderationResult: ModerationResult, @User('passport') passport: string){
        return await this.questionService.moderate(moderationResult, passport);
    }
    
    @Auth()
    @Access(AccessLevel.Admin)
    @Post('create-generation-pattern')
    @HttpCode(HttpStatus.OK)
    async createGenerationPattern(@Body() patternDto: GenerationPatternDTO, @User('language') language: string, @User('passport') passport: string){
        return await this.questionService.createGenerationPattern(patternDto, language, passport);
    }
}
