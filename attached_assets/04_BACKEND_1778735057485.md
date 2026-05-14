# ⚙️ Backend — Java Spring Boot

## Dépendances Maven (`pom.xml`)

```xml
<dependencies>
    <!-- Spring Boot -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>

    <!-- PostgreSQL -->
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <scope>runtime</scope>
    </dependency>

    <!-- JWT -->
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.12.3</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-impl</artifactId>
        <version>0.12.3</version>
        <scope>runtime</scope>
    </dependency>

    <!-- HTTP Client pour Claude API -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-webflux</artifactId>
    </dependency>

    <!-- Lombok -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
</dependencies>
```

---

## Structure des packages

```
src/main/java/com/budgetsmart/
│
├── BudgetSmartApplication.java
│
├── config/
│   ├── SecurityConfig.java          # Spring Security + CORS
│   ├── JwtAuthFilter.java           # Filtre JWT par requête
│   └── AnthropicConfig.java         # WebClient pour Claude API
│
├── controller/
│   ├── AuthController.java
│   ├── UserController.java
│   ├── CategoryController.java
│   ├── RevenueController.java
│   ├── ExpenseController.java
│   ├── SavingsController.java
│   ├── AlertController.java
│   ├── DashboardController.java
│   └── ChatController.java
│
├── service/
│   ├── AuthService.java
│   ├── UserService.java
│   ├── CategoryService.java
│   ├── RevenueService.java
│   ├── ExpenseService.java
│   ├── SavingsService.java
│   ├── AlertService.java
│   ├── DashboardService.java
│   ├── ChatService.java             # Appel Claude API
│   └── JwtService.java
│
├── repository/
│   ├── UserRepository.java
│   ├── CategoryRepository.java
│   ├── RevenueRepository.java
│   ├── ExpenseRepository.java
│   ├── SavingsGoalRepository.java
│   └── AlertRepository.java
│
├── entity/
│   ├── User.java
│   ├── Category.java
│   ├── Revenue.java
│   ├── Expense.java
│   ├── SavingsGoal.java
│   └── BudgetAlert.java
│
├── dto/
│   ├── request/
│   │   ├── RegisterRequest.java
│   │   ├── LoginRequest.java
│   │   ├── ExpenseRequest.java
│   │   ├── RevenueRequest.java
│   │   ├── SavingsGoalRequest.java
│   │   ├── DepositRequest.java
│   │   ├── CategoryRequest.java
│   │   ├── UpdateUserRequest.java
│   │   └── ChatRequest.java
│   └── response/
│       ├── ApiResponse.java          # Wrapper générique
│       ├── AuthResponse.java
│       ├── ExpenseResponse.java
│       ├── RevenueResponse.java
│       ├── SavingsResponse.java
│       ├── AlertResponse.java
│       ├── DashboardResponse.java
│       └── ChatResponse.java
│
└── exception/
    ├── GlobalExceptionHandler.java   # @ControllerAdvice
    ├── ResourceNotFoundException.java
    ├── EmailAlreadyExistsException.java
    └── ForbiddenException.java
```

---

## Entités JPA

### `User.java`

```java
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "monthly_budget", precision = 12, scale = 2)
    private BigDecimal monthlyBudget = BigDecimal.ZERO;

    @Column(name = "created_at")
    private LocalDate createdAt = LocalDate.now();
}
```

---

### `Expense.java`

```java
@Entity
@Table(name = "expenses")
@Data
@NoArgsConstructor
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(length = 255)
    private String description;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
```

---

### `SavingsGoal.java`

```java
@Entity
@Table(name = "savings_goals")
@Data
@NoArgsConstructor
public class SavingsGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "target_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal targetAmount;

    @Column(name = "current_amount", precision = 12, scale = 2)
    private BigDecimal currentAmount = BigDecimal.ZERO;

    private LocalDate deadline;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
```

---

## Repository (exemples)

### `ExpenseRepository.java`

```java
@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByUserIdOrderByDateDesc(Long userId);

    @Query("SELECT e FROM Expense e WHERE e.user.id = :userId " +
           "AND FUNCTION('DATE_TRUNC', 'month', e.date) = FUNCTION('DATE_TRUNC', 'month', :month)")
    List<Expense> findByUserIdAndMonth(@Param("userId") Long userId,
                                       @Param("month") LocalDate month);

    @Query("SELECT SUM(e.amount) FROM Expense e WHERE e.user.id = :userId " +
           "AND YEAR(e.date) = :year AND MONTH(e.date) = :month")
    BigDecimal sumByUserAndMonth(@Param("userId") Long userId,
                                 @Param("year") int year,
                                 @Param("month") int month);
}
```

---

## Wrapper de réponse

### `ApiResponse.java`

```java
@Data
@AllArgsConstructor
public class ApiResponse<T> {

    private boolean success;
    private T data;
    private String message;
    private ErrorDetail error;

    // Succès avec données
    public static <T> ApiResponse<T> ok(T data, String message) {
        return new ApiResponse<>(true, data, message, null);
    }

    // Succès sans message
    public static <T> ApiResponse<T> ok(T data) {
        return ok(data, null);
    }

    // Erreur
    public static <T> ApiResponse<T> error(String code, String message, List<String> details) {
        ErrorDetail err = new ErrorDetail(code, message, details);
        return new ApiResponse<>(false, null, null, err);
    }

    @Data
    @AllArgsConstructor
    public static class ErrorDetail {
        private String code;
        private String message;
        private List<String> details;
    }
}
```

---

## Services (exemples)

### `ExpenseService.java`

```java
@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public ExpenseResponse create(Long userId, ExpenseRequest req) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        Category category = categoryRepository.findByIdAndUserId(req.getCategoryId(), userId)
            .orElseThrow(() -> new ResourceNotFoundException("Catégorie introuvable"));

        Expense expense = new Expense();
        expense.setUser(user);
        expense.setCategory(category);
        expense.setAmount(req.getAmount());
        expense.setDescription(req.getDescription());
        expense.setDate(req.getDate() != null ? req.getDate() : LocalDate.now());

        // Le trigger PostgreSQL se déclenche automatiquement ici
        Expense saved = expenseRepository.save(expense);

        return toResponse(saved);
    }

    public List<ExpenseResponse> findByUserAndMonth(Long userId, String month) {
        LocalDate date = month != null
            ? YearMonth.parse(month).atDay(1)
            : LocalDate.now().withDayOfMonth(1);

        return expenseRepository.findByUserIdAndMonth(userId, date)
            .stream().map(this::toResponse).toList();
    }

    public void delete(Long userId, Long expenseId) {
        Expense expense = expenseRepository.findById(expenseId)
            .orElseThrow(() -> new ResourceNotFoundException("Dépense introuvable"));

        if (!expense.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Accès refusé à cette ressource");
        }

        expenseRepository.delete(expense);
    }

    private ExpenseResponse toResponse(Expense e) {
        // mapping entité -> DTO
    }
}
```

---

### `ChatService.java`

```java
@Service
@RequiredArgsConstructor
public class ChatService {

    private final WebClient webClient;
    private final DashboardService dashboardService;

    @Value("${anthropic.api.key}")
    private String apiKey;

    public String chat(Long userId, String userMessage, List<ChatMessage> history) {
        // Récupérer le contexte financier de l'utilisateur
        DashboardResponse dashboard = dashboardService.getMonthSummary(userId);

        String systemPrompt = String.format("""
            Tu es un assistant financier personnel pour l'application BudgetSmart.
            Voici les données financières de l'utilisateur pour ce mois :
            - Revenus totaux : %.2f €
            - Dépenses totales : %.2f €
            - Budget mensuel : %.2f €
            - Budget utilisé : %.1f%%
            - Épargne totale : %.2f €
            
            Réponds de manière concise, en français, avec des conseils personnalisés.
            """,
            dashboard.getTotalRevenues(),
            dashboard.getTotalExpenses(),
            dashboard.getMonthlyBudget(),
            dashboard.getBudgetUsedPercent(),
            dashboard.getTotalSavings()
        );

        // Construction du body pour l'API Anthropic
        Map<String, Object> body = Map.of(
            "model", "claude-sonnet-4-20250514",
            "max_tokens", 500,
            "system", systemPrompt,
            "messages", buildMessages(history, userMessage)
        );

        return webClient.post()
            .uri("https://api.anthropic.com/v1/messages")
            .header("x-api-key", apiKey)
            .header("anthropic-version", "2023-06-01")
            .bodyValue(body)
            .retrieve()
            .bodyToMono(Map.class)
            .map(resp -> {
                List<Map<String, Object>> content = (List<Map<String, Object>>) resp.get("content");
                return (String) content.get(0).get("text");
            })
            .block();
    }

    private List<Map<String, String>> buildMessages(List<ChatMessage> history, String newMessage) {
        List<Map<String, String>> messages = new ArrayList<>();
        history.forEach(m -> messages.add(Map.of("role", m.getRole(), "content", m.getContent())));
        messages.add(Map.of("role", "user", "content", newMessage));
        return messages;
    }
}
```

---

## Contrôleurs (exemples)

### `ExpenseController.java`

```java
@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getExpenses(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String month) {

        Long userId = getUserId(userDetails);
        List<ExpenseResponse> items = expenseService.findByUserAndMonth(userId, month);
        BigDecimal total = items.stream()
            .map(ExpenseResponse::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> data = Map.of(
            "items", items,
            "total", total,
            "count", items.size()
        );

        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ExpenseResponse>> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ExpenseRequest request) {

        Long userId = getUserId(userDetails);
        ExpenseResponse created = expenseService.create(userId, request);
        return ResponseEntity.status(201).body(ApiResponse.ok(created, "Dépense ajoutée"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ExpenseResponse>> update(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody ExpenseRequest request) {

        Long userId = getUserId(userDetails);
        ExpenseResponse updated = expenseService.update(userId, id, request);
        return ResponseEntity.ok(ApiResponse.ok(updated, "Dépense modifiée"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {

        Long userId = getUserId(userDetails);
        expenseService.delete(userId, id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Dépense supprimée"));
    }

    private Long getUserId(UserDetails userDetails) {
        return ((UserPrincipal) userDetails).getId();
    }
}
```

---

## Gestion des exceptions

### `GlobalExceptionHandler.java`

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(404)
            .body(ApiResponse.error("NOT_FOUND", ex.getMessage(), List.of()));
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ApiResponse<?>> handleForbidden(ForbiddenException ex) {
        return ResponseEntity.status(403)
            .body(ApiResponse.error("FORBIDDEN", ex.getMessage(), List.of()));
    }

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<ApiResponse<?>> handleEmailExists(EmailAlreadyExistsException ex) {
        return ResponseEntity.status(400)
            .body(ApiResponse.error("EMAIL_ALREADY_EXISTS", ex.getMessage(), List.of()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> handleValidation(MethodArgumentNotValidException ex) {
        List<String> details = ex.getBindingResult()
            .getFieldErrors().stream()
            .map(FieldError::getDefaultMessage)
            .toList();

        return ResponseEntity.status(400)
            .body(ApiResponse.error("VALIDATION_ERROR", "Données invalides", details));
    }
}
```

---

## Configuration sécurité

### `SecurityConfig.java`

```java
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfig()))
            .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean
    public CorsConfigurationSource corsConfig() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:3000"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

---

## `application.properties`

```properties
# Base de données
spring.datasource.url=jdbc:postgresql://localhost:5432/budgetsmart
spring.datasource.username=postgres
spring.datasource.password=secret
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false

# JWT
jwt.secret=3cfa76ef14937c1c0ea519f8fc057a80fcd04a7420f8e8bcd0a7567c272e007b
jwt.expiration=86400000

# Anthropic Claude
anthropic.api.key=${ANTHROPIC_API_KEY}

# Port
server.port=8080
```
