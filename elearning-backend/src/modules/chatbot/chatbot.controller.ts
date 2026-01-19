
import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { ChatbotService } from './chatbot.service';
import { ChatRequestDto } from './dto/chat-request.dto';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('chat')
  async chat(@Body() chatRequest: ChatRequestDto, @Res() res: Response) {
    try {
      const reply = await this.chatbotService.generateResponse(chatRequest.message, chatRequest.history);
      return res.status(HttpStatus.OK).json({ reply });
    } catch (error) {
      console.error('Chatbot Error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ 
        message: 'AI đang bận, vui lòng thử lại sau.',
        error: error.message 
      });
    }
  }
}
