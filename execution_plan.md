# SIRAJ – Execution Plan

---

## 🧠 Goal

Build the system step-by-step without skipping layers.

---

## 🚀 Phase 1: Core RFQ System

### Step 1: Database

* Create tables
* Apply RLS
* Validate relationships

---

### Step 2: RFQ Creation

* Page: /rfqs/new
* API: POST /api/rfqs
* Store RFQ + template

---

### Step 3: Supplier System

* Add supplier
* Select supplier
* Store supplier list

---

### Step 4: Invite System

* Generate token per supplier
* Save in rfq_invites
* Build public link

---

### Step 5: Public Form

* Route: /form/[rfq_id]
* Validate token
* Render dynamic form

---

### Step 6: Responses

* POST /api/responses
* Store answers (JSON)
* Save price + delivery

---

### Step 7: RFQ Detail Page

* Show invites
* Show responses
* Basic comparison

---

## ⚠️ Rules

* Do NOT skip steps
* Do NOT jump to AI
* Do NOT change DB structure mid-way

---

## 🎯 Definition of Done

Phase 1 is complete when:

* RFQ created
* Supplier invited
* Supplier submits
* Response visible
