# NOTA BENE

**NOTA BENE** è un'applicazione web realizzata come progetto di Ingegneria del Software (a.a. 2024/2025) – Università di Bologna.

##  Descrizione
L’app permette di creare, organizzare e condividere note testuali (max 280 caratteri) con versionamento e permessi di lettura/scrittura.

##  Stack Tecnologico
- **Backend:** Spring Boot (Web + Data JPA)  
- **Frontend:** HTML, CSS, JavaScript vanilla (static files serviti da Spring Boot)  
- **Database:** PostgreSQL (Supabase)  
- **Containerizzazione:** Docker & Docker Compose  
- **Testing:** JUnit  

##  Prerequisiti
- Java 17+  
- Maven 3.6+  
- Docker & Docker Compose  
- Account Supabase con database PostgreSQL

## ⚙ Setup locale

1. **Clona il repository**  
   ```bash
   git clone git@github.com:TUO-ORG/nota-bene.git
   cd nota-bene
   ```
2. **Genera lo scheletro da Spring Initializr**  
   - Scarica e scompatta il ZIP in `nota-bene/`.
     
3. **Configura le variabili d’ambiente**  
   ```bash
   export DATABASE_URL=jdbc:postgresql://xx.xxx.supabase.co:5432/nota_bene
   export DATABASE_USER=tuo_user
   export DATABASE_PASSWORD=tuo_password
   ```
4. **Build & run con Docker Compose**  
   ```bash
   docker-compose up --build
   ```
5. **Accedi all’app**  
   Apri il browser su `http://localhost:8080`

##  Docker & Docker Compose

- **Dockerfile**: definisce il container Spring Boot  
- **docker-compose.yml**:  
  ```yaml
  version: '3.8'
  services:
    app:
      build: .
      ports:
        - "8080:8080"
      environment:
        SPRING_DATASOURCE_URL: ${DATABASE_URL}
        SPRING_DATASOURCE_USERNAME: ${DATABASE_USER}
        SPRING_DATASOURCE_PASSWORD: ${DATABASE_PASSWORD}
    db:
      image: postgres:15
      environment:
        POSTGRES_DB: nota_bene
        POSTGRES_USER: ${DATABASE_USER}
        POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
      ports:
        - "5432:5432"
  ```
- **.dockerignore**:  
  ```
  target/
  *.log
  *.tmp
  ```

## 🔧 Comandi utili
- **Build**: `mvn clean package`  
- **Test**: `mvn test`  
- **Run local (IDE)**: `mvn spring-boot:run`  

##  Struttura del progetto
```
nota-bene/
├── docs/                           # Documentazione progetto
│   ├── modello-dominio.md
│   ├── casi-uso.md
│   ├── manuale-utente.md
│   ├── manuale-sviluppatore.md
│   ├── diario-progetto.md
│   └── burn-down-chart.md
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/noteapp/
│   │   │       ├── NotaBeneApplication.java
│   │   │       ├── controller/          # REST Controllers
│   │   │        |── service/             # Business Logic
│   │   │       ├── model/               # Domain Models
│   │   │       ├── dto/                 # Data Transfer Objects
│   │   │       └── config/              # Configuration
│   │   └── resources/
│   │       ├── static/                  # Frontend files
│   │       │   ├── html/
│   │       │   ├── css/
│   │       │   └── js/            
│   │       └── application.yml
│   └── test/
│       └── java/
│           └── com/noteapp/
│               ├── controller/          # Controller tests
│               ├── service/             # Service tests (TDD)
│               ├── repository/          # Repository tests
│               └── integration/         # Integration tests
├── docker-compose.yml                  # Database locale per dev
├── Dockerfile
├── .gitignore
├── README.md                           # Setup instructions
└── pom.xml

```

##  Autori
- **Frank Toscani** 
- **Zhiyuan Xie** 
- **Andrea Croci**

I componenti del gruppo si immedesimano a turno in (tra parentesi quadre il numero di membri che devono immedesimarsi nel ruolo):
   ○ Development team [2]
   ○ Scrum master [1 se il gruppo è da 4, 1 che farà anche parte anche del development team se il gruppo è da 3]
   ○ Product owner [1]
I ruoli si cambiano al termine di ogni sprint.
