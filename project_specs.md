# SIRAJ – Project Specifications

---

## 🧠 Purpose of This File

This document defines the **product logic, scope, and system behavior**.

It must be read **before CLAUDE.md**.

Goal:
Ensure the system is built correctly, not just coded.

---

## 🎯 Product Overview

SIRAJ is a SaaS platform that transforms how companies handle supplier quotations (RFQs).

Instead of scattered communication (emails, WhatsApp, spreadsheets), SIRAJ provides:

* A structured RFQ system
* Centralized supplier responses
* Clear comparison for decision-making

---

## 🚨 The Core Problem

Companies today:

* Send RFQs manually (email / WhatsApp)
* Receive responses in different formats
* Struggle to compare offers
* Lose time and miss better decisions

---

## ✅ The Solution

SIRAJ replaces the chaos with:

1. A structured RFQ creation system
2. A single link sent to suppliers
3. Standardized response collection
4. A unified comparison view

---

## 👥 User Roles

### 1. Buyer (Main User)

* Creates RFQs
* Manages suppliers
* Sends requests
* Reviews responses

---

### 2. Supplier

* Receives a link
* Submits response
* Does NOT need an account

---

## 🔄 Core System Flow

```text
Create RFQ
→ Assign suppliers
→ Generate unique access links
→ Supplier submits response
→ Responses are stored and structured
→ Buyer compares and decides
```

---

## 🧱 Core System Modules

### 1. RFQ Engine

* Create RFQs
* Attach dynamic structure (schema)
* Store metadata (title, description)

---

### 2. Supplier System

* Add and store suppliers
* Reuse suppliers across RFQs
* Group by category (optional)

---

### 3. Invite System

* Generate unique token per supplier
* Token controls access to RFQ form

Public route:

```
/form/[rfq_id]?token=...
```

---

### 4. Dynamic Form Engine

* Render fields from JSON schema
* No hardcoded fields

Supported types:

* text
* number
* textarea
* select

---

### 5. Response System

* Store responses as structured data
* Include:

  * price
  * delivery time
  * additional fields (dynamic)

---

### 6. Comparison System

* Display all supplier responses
* Enable side-by-side comparison
* Prepare data for future scoring

---

## 📊 Data Model (Conceptual)

### rfqs

* id
* user_id
* title
* description

### suppliers

* id
* user_id
* name
* email

### rfq_invites

* id
* rfq_id
* supplier_email
* token
* responded

### responses

* id
* rfq_id
* supplier_email
* answers (JSON)
* price
* delivery_days

---

## ⚙️ Functional Requirements

* RFQs must support dynamic fields
* Each supplier must have a unique access token
* Supplier form must NOT require login
* Responses must be tied to RFQ and supplier
* Buyer must see all responses in one place

---

## 🔐 Security Requirements

* Token-based access must be validated
* Supplier can only access their RFQ via token
* No sensitive data exposed on client
* All writes must be validated server-side

---

## 🚀 Non-Functional Requirements

* Fast and responsive UI
* Clean architecture
* Scalable database design
* Modular codebase

---

## 🧪 Edge Cases

* Supplier submits multiple times
* Invalid or missing token
* RFQ without suppliers
* Duplicate supplier emails
* Missing required fields

---

## 📦 Out of Scope (Phase 1)

* AI recommendations
* Chat systems
* Advanced analytics
* Notifications (SMS / WhatsApp)

---

## 🧭 Product Philosophy

* Keep it simple
* Focus on workflow efficiency
* Reduce friction
* Avoid over-engineering

---

## 💬 Final Principle

SIRAJ is not just a tool.

It is:

> A structured decision-making system for supplier selection.
