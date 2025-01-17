"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Form, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Icons } from "@/components/icons"
import { chatbotSchema } from "@/lib/validations/chatbot"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChatbotModel, File } from "@prisma/client"

type FormData = z.infer<typeof chatbotSchema>

interface NewChatbotProps extends React.HTMLAttributes<HTMLElement> {
    isOnboarding: boolean
}

export function NewChatbotForm({ isOnboarding, className, ...props }: NewChatbotProps) {
    const router = useRouter()
    const form = useForm<FormData>({
        resolver: zodResolver(chatbotSchema),
        defaultValues: {
            welcomeMessage: "Hello, how can I help you?",
            prompt: "You are an assistant you help users that visit our website, keep it short, always refer to the documentation provided and never ask for more information.",
        }
    })

    const [models, setModels] = useState<ChatbotModel[]>([])
    const [files, setFiles] = useState<File[]>([])
    const [isSaving, setIsSaving] = useState<boolean>(false)

    useEffect(() => {
        const init = async () => {
            const response = await fetch('/api/models', {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            })
            const models = await response.json()
            setModels(models)

            const filesResponse = await getFiles()
            setFiles(filesResponse)
        }
        init()
    }, [])

    async function getFiles() {
        const response = await fetch('/api/files', {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })

        const files = await response.json()
        return files
    }

    async function onSubmit(data: FormData) {
        setIsSaving(true)
        console.log(data)

        const response = await fetch(`/api/chatbots`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: data.name,
                prompt: data.prompt,
                openAIKey: data.openAIKey,
                welcomeMessage: data.welcomeMessage,
                modelId: data.modelId,
                files: data.files
            }),
        })

        setIsSaving(false)

        if (!response?.ok) {
            if (response.status === 402) {
                return toast({
                    title: "Chatbot limit reached.",
                    description: "Please upgrade to the a higher plan.",
                    variant: "destructive",
                })
            }
            return toast({
                title: "Something went wrong.",
                description: "Your chatbot was not saved. Please try again.",
                variant: "destructive",
            })
        }

        toast({
            description: "Your chatbot has been saved.",
        })

        router.refresh()
        if (!isOnboarding) {
            router.push("/dashboard/chatbots")
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle>Create new Chatbot</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel htmlFor="name">
                                        Display Name
                                    </FormLabel>
                                    <Input
                                        onChange={field.onChange}
                                        id="name"
                                    />
                                    <FormDescription>
                                        The name that will be displayed in the dashboard
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="welcomeMessage"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel htmlFor="welcomemessage">
                                        Welcome message
                                    </FormLabel>
                                    <Input
                                        onChange={field.onChange}
                                        value={field.value}
                                        id="welcomemessage"
                                    />
                                    <FormDescription>
                                        The welcome message that will be sent to the user when they start a conversation
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>)}
                        />
                        <FormField
                            control={form.control}
                            name="prompt"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel htmlFor="prompt">
                                        Default prompt
                                    </FormLabel >
                                    <Input
                                        onChange={field.onChange}
                                        value={field.value}
                                        id="prompt"
                                    />
                                    <FormDescription>
                                        The prompt that will be sent to OpenAI for every messages, here&apos;s and example:
                                        &quot;You are an assistant you help users that visit our website, keep it short, always refer to the documentation provided and never ask for more information.&quot;
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="modelId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel htmlFor="model">
                                        Open AI Model
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a model" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {
                                                    models.map((model: ChatbotModel) => (
                                                        <SelectItem key={model.id} value={model.id}>
                                                            {model.name}
                                                        </SelectItem>
                                                    ))
                                                }
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>

                                    <FormDescription>
                                        The Open AI model that will be used to generate responses.
                                        <b> If you use gpt-4 it may not be available in your account.</b>
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="openAIKey"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel htmlFor="openAIKey">
                                        Open AI API Key
                                    </FormLabel>
                                    <Input
                                        onChange={field.onChange}
                                        id="openAIKey"
                                        type="password"
                                    />
                                    <FormDescription>
                                        The Open AI API key that will be used to generate responses
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="files"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Choose your file for retrival
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a file" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {
                                                    files.map((file: any) => (
                                                        <SelectItem key={file.uploadFileId} value={file.id}>
                                                            {file.name}
                                                        </SelectItem>
                                                    ))
                                                }
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        The Open AI model will use this file to search for specific content.
                                        If you don&apos;t have a file yet, it is because you haven&apos;t published any file.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter>
                        <button
                            type="submit"
                            className={cn(buttonVariants(), className)}
                            disabled={isSaving}
                        >
                            {isSaving && (
                                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            <span>Create</span>
                        </button>
                    </CardFooter>
                </Card>
            </form >
        </Form >
    )
}
