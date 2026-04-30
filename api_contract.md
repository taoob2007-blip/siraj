# API Contract

---

## POST /api/rfqs

Request:
{
title: string,
description: string,
template_id: string
}

Response:
{
id: string
}

---

## POST /api/responses

Request:
{
rfq_id: string,
token: string,
answers: object
}

Response:
{
success: true
}

---

## Rules

* Always validate input
* Always return JSON
* No silent failures
