from unsloth import FastLanguageModel
import torch
from datasets import load_dataset
from trl import SFTTrainer
from transformers import TrainingArguments
from unsloth import is_bfloat16_supported

# 1. Cấu hình Model
max_seq_length = 2048 # Độ dài tối đa của câu
dtype = None # Tự động phát hiện (Float16 hoặc Bfloat16)
load_in_4bit = True # Dùng 4-bit để tiết kiệm RAM/VRAM

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "unsloth/Meta-Llama-3.1-8B-bnb-4bit", # Model nền
    max_seq_length = max_seq_length,
    dtype = dtype,
    load_in_4bit = load_in_4bit,
)

# 2. Thêm LoRA (Fine-tuning technique)
model = FastLanguageModel.get_peft_model(
    model,
    r = 16, # Rank
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj",
                      "gate_proj", "up_proj", "down_proj",],
    lora_alpha = 16,
    lora_dropout = 0,
    bias = "none",
    use_gradient_checkpointing = "unsloth",
    random_state = 3407,
)

# 3. Load Dữ liệu của bạn
# Chuyển đổi file .jsonl thành format mà model hiểu được
def formatting_prompts_func(examples):
    instructions = examples["messages"]
    texts = []
    for messages in instructions:
        # Format: System -> User -> Assistant
        text = f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{messages[0]['content']}<|eot_id|>".format(messages[0]['content'])
        text += f"<|start_header_id|>user<|end_header_id|>\n\n{messages[1]['content']}<|eot_id|>".format(messages[1]['content'])
        text += f"<|start_header_id|>assistant<|end_header_id|>\n\n{messages[2]['content']}<|eot_id|>".format(messages[2]['content'])
        texts.append(text)
    return { "text" : texts, }

dataset = load_dataset("json", data_files="ai_training_data.jsonl", split="train")
dataset = dataset.map(formatting_prompts_func, batched = True,)

# 4. Cấu hình Huấn luyện
trainer = SFTTrainer(
    model = model,
    tokenizer = tokenizer,
    train_dataset = dataset,
    dataset_text_field = "text",
    max_seq_length = max_seq_length,
    dataset_num_proc = 2,
    packing = False, # Có thể để True nếu dữ liệu rất dài
    args = TrainingArguments(
        per_device_train_batch_size = 2,
        gradient_accumulation_steps = 4,
        warmup_steps = 5,
        max_steps = 60, # Số bước huấn luyện (tùy chỉnh dựa trên lượng dữ liệu)
        learning_rate = 2e-4,
        fp16 = not is_bfloat16_supported(),
        bf16 = is_bfloat16_supported(),
        logging_steps = 1,
        optim = "adamw_8bit",
        weight_decay = 0.01,
        lr_scheduler_type = "linear",
        seed = 3407,
        output_dir = "outputs",
    ),
)

# 5. Bắt đầu Huấn luyện
trainer_stats = trainer.train()

# 6. Lưu Model dưới dạng GGUF (Để chạy với Ollama)
model.save_pretrained_gguf("model_da_huon_luyen", tokenizer, quantization_method = "q4_k_m")

print("✅ Huấn luyện hoàn tất! Model đã được lưu tại thư mục 'model_da_huon_luyen'")
