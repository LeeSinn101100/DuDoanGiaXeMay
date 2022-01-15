#include <node.h>
#include <iostream>

extern "C"
{
	NODE_EXTERN char* PythonExecute(char* source);
	NODE_EXTERN void PythonInit();
	NODE_EXTERN void PythonDeInit();
}

void Hello(const v8::FunctionCallbackInfo<v8::Value>& args)
{
    v8::Isolate* isolate = args.GetIsolate();
	auto message = v8::String::NewFromUtf8(isolate, "Hello, World from C++!").ToLocalChecked();
	args.GetReturnValue().Set(message);
}

void Init(const v8::FunctionCallbackInfo<v8::Value>& args)
{
	PythonInit();
}

void DeInit(const v8::FunctionCallbackInfo<v8::Value>& args)
{
	PythonDeInit();
}

void Execute(const v8::FunctionCallbackInfo<v8::Value>& args)
{
	v8::Isolate* isolate = args.GetIsolate();

	auto jsstr = args[0];

	auto& utf8 = v8::String::Utf8Value(isolate, jsstr);
	auto str = *utf8;

	auto ret = PythonExecute(str);

	auto message = v8::String::NewFromUtf8(isolate, ret).ToLocalChecked();

	args.GetReturnValue().Set(message);
}

void Initialize(v8::Local<v8::Object> exports) 
{
	NODE_SET_METHOD(exports, "Hello", Hello);
	NODE_SET_METHOD(exports, "Execute", Execute);

	NODE_SET_METHOD(exports, "Initialize", Init);
	NODE_SET_METHOD(exports, "DeInitialize", DeInit);

	PythonInit();
}

NODE_MODULE(module_name, Initialize)