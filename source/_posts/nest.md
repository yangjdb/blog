---
title: nestjs 介绍（一）
comments: true
date: 2018-01-07 20:01:52
tags: nestjs
categories: 技术
keywords: nestjs node.js
---

<div style="text-align: center">
![nest logo](http://kamilmysliwiec.com/public/nest-logo.png)
</div>

## 简介
---
关于nestjs，官方给出的说明是这样的：

> 一个强大的，渐进式的框架，用来建立高效可伸缩式的服务端应用；
使用现代式的js语法，构建于TypeScript，并且向下兼容；
采用面向对象编程思想，使用函数式编程；

oh，shit！又是框架，相信前端的童鞋们看到框架这个词，心中都是神兽在奔腾吧。。。
无妨，让我们先冷静一下，看看这个'框架'到底是什么来头

查了下gh，发现虽然nest构建至今不到半年，也才发布了10个版本，但是已然收获了3k+的star，口碑不错。
[nestjs](https://github.com/nestjs) :400+的commit，1 branch，10 release，19 contributors。

**作者**：Kamil Myśliwiec  (波兰人，Scal.io高级软件工程师，nestjs创始人，angular顾问，react顾问，node.js顾问，TypeScript狂热爱好者) 膜拜大神……

**开源情况**：MIT协议授权，已有谷歌，Uber，微软的一批支持者。

另外，月底 ngATL Conference Atlanta 的开发者大会上，nest工作室会讲解以下内容：
• NestJS framework main concepts
• The REST API building from scratch
• WebSockets
• Authentication using JSON Web Tokens
• Automatic body  shape verification
• TypeORM
• Auto-documenting API with Swagger module
• Apollo GraphQL integration
• Tips and best practices
有条件的同学可以报名，希望到时候有资料可以学习。

好了，正片开始……

## 惊艳
---
当我第一次看到nest的时候，就被它深深的吸引了，模块化的构建，优雅的依赖注入，松耦合的架构设计，编译式开发，易重构易维护，让我意识到node.js框架的统一已不再遥远。也正是因为想拥趸nest，想跟更多的前端同学布道，才有了写blog的初衷。

### 环境

* node.js 6.11.0+(推荐LTS)
* ES6+babel
* TypeScript(推荐)

### 安装

```bash
$ git clone https://github.com/nestjs/typescript-starter.git project
$ cd project
$ npm install
```

### 启动

```bash
$ npm run start
```

### 编译

```bash
$ tsc
```

时间有限，第一篇介绍先写到这里，感兴趣的同学可以查阅官方文档 [nest官方文档](https://docs.nestjs.com/)

后续将继续介绍nest框架原理，应用，优化以及实战等知识，欢迎大家拍砖~~
如有疑问，可留言或提交issue。