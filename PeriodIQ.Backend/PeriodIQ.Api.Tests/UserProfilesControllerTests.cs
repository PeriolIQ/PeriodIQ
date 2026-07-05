using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using PeriodIQ.Api.Controllers;
using PeriodIQ.Core.Interfaces.Repositories;
using PeriodIQ.Core.Services;
using PeriodIQ.Domain.Entities;

namespace PeriodIQ.Api.Tests;

public class UserProfilesControllerTests
{
    private readonly Mock<IUserProfileRepository> _repo = new();
    private readonly UserProfilesController _controller;

    // UserId giả lập — giống claim "sub" mà Cognito gửi về
    private const string TestUserId = "cognito-sub-abc123";
    private const string TestEmail  = "test@example.com";

    public UserProfilesControllerTests()
    {
        _controller = new UserProfilesController(new UserProfileService(_repo.Object));
        // Giả lập JWT Claims (giống như khi user đã login Cognito)
        SetupUserClaims(TestUserId, TestEmail);
    }

    /// <summary>
    /// Gắn fake ClaimsPrincipal vào Controller.User, mô phỏng JWT token từ Cognito.
    /// </summary>
    private void SetupUserClaims(string sub, string email, string[]? groups = null)
    {
        var claims = new List<Claim>
        {
            new("sub", sub),
            new("email", email),
        };
        if (groups != null)
        {
            foreach (var g in groups)
                claims.Add(new("cognito:groups", g));
        }

        var identity  = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GET /api/userprofiles/me
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task GetMyProfile_WhenProfileExists_ReturnsOkWithProfile()
    {
        var profile = new UserProfile
        {
            Id       = TestUserId,
            Email    = TestEmail,
            FullName = "Nguyễn Văn A",
            Gender   = "Male",
            BodyWeightKg        = 75,
            FitnessLevel        = "Intermediate",
            PrimaryGoal         = "Hypertrophy",
            AvailableDaysPerWeek = 4,
            SubscriptionTier    = "Free",
        };
        _repo.Setup(r => r.GetByIdAsync(TestUserId)).ReturnsAsync(profile);

        var result = await _controller.GetMyProfile();

        var ok = Assert.IsType<OkObjectResult>(result);
        var returned = Assert.IsType<UserProfile>(ok.Value);
        Assert.Equal(TestUserId, returned.Id);
        Assert.Equal("Nguyễn Văn A", returned.FullName);
        Assert.Equal(75, returned.BodyWeightKg);
    }

    [Fact]
    public async Task GetMyProfile_WhenNoProfile_ReturnsNotFound()
    {
        _repo.Setup(r => r.GetByIdAsync(TestUserId)).ReturnsAsync((UserProfile)null!);

        var result = await _controller.GetMyProfile();

        Assert.IsType<NotFoundObjectResult>(result);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // POST /api/userprofiles/me
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task CreateMyProfile_WhenNew_ReturnsCreatedAtAction()
    {
        _repo.Setup(r => r.GetByIdAsync(TestUserId)).ReturnsAsync((UserProfile)null!);
        _repo.Setup(r => r.AddAsync(It.IsAny<UserProfile>())).Returns(Task.CompletedTask);

        var dto = new UserProfileDto
        {
            FullName = "Trần Thị B",
            Email    = "custom@email.com",
            Gender   = "Female",
            BodyWeightKg        = 55,
            FitnessLevel        = "Beginner",
            PrimaryGoal         = "Strength",
            AvailableDaysPerWeek = 3,
        };

        var result = await _controller.CreateMyProfile(dto);

        var created = Assert.IsType<CreatedAtActionResult>(result);
        var profile = Assert.IsType<UserProfile>(created.Value);
        // Id luôn lấy từ JWT, không phải từ DTO
        Assert.Equal(TestUserId, profile.Id);
        // Nếu DTO gửi email thì dùng email DTO
        Assert.Equal("custom@email.com", profile.Email);
        Assert.Equal("Trần Thị B", profile.FullName);
        Assert.Equal("Free", profile.SubscriptionTier);

        _repo.Verify(r => r.AddAsync(It.Is<UserProfile>(p =>
            p.Id == TestUserId && p.FullName == "Trần Thị B"
        )), Times.Once);
    }

    [Fact]
    public async Task CreateMyProfile_WhenDtoEmailEmpty_UsesJwtEmail()
    {
        _repo.Setup(r => r.GetByIdAsync(TestUserId)).ReturnsAsync((UserProfile)null!);
        _repo.Setup(r => r.AddAsync(It.IsAny<UserProfile>())).Returns(Task.CompletedTask);

        var dto = new UserProfileDto
        {
            FullName = "No Email User",
            Email    = "",  // rỗng → nên fallback về claim "email"
            Gender   = "Male",
        };

        var result = await _controller.CreateMyProfile(dto);

        var created = Assert.IsType<CreatedAtActionResult>(result);
        var profile = Assert.IsType<UserProfile>(created.Value);
        Assert.Equal(TestEmail, profile.Email);
    }

    [Fact]
    public async Task CreateMyProfile_WhenAlreadyExists_ReturnsConflict()
    {
        var existing = new UserProfile { Id = TestUserId, FullName = "Existing" };
        _repo.Setup(r => r.GetByIdAsync(TestUserId)).ReturnsAsync(existing);

        var dto = new UserProfileDto { FullName = "Duplicate" };
        var result = await _controller.CreateMyProfile(dto);

        Assert.IsType<ConflictObjectResult>(result);
        _repo.Verify(r => r.AddAsync(It.IsAny<UserProfile>()), Times.Never);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PUT /api/userprofiles/me
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task UpdateMyProfile_WhenExists_ReturnsOkWithUpdatedProfile()
    {
        var existing = new UserProfile
        {
            Id           = TestUserId,
            Email        = TestEmail,
            FullName     = "Old Name",
            Gender       = "Male",
            BodyWeightKg = 70,
            FitnessLevel = "Beginner",
            PrimaryGoal  = "Strength",
            AvailableDaysPerWeek = 3,
        };
        _repo.Setup(r => r.GetByIdAsync(TestUserId)).ReturnsAsync(existing);
        _repo.Setup(r => r.UpdateAsync(It.IsAny<UserProfile>())).Returns(Task.CompletedTask);

        var dto = new UserProfileDto
        {
            FullName     = "New Name",
            Email        = "new@email.com",
            Gender       = "Male",
            BodyWeightKg = 80,
            FitnessLevel = "Advanced",
            PrimaryGoal  = "Hypertrophy",
            AvailableDaysPerWeek = 5,
        };

        var result = await _controller.UpdateMyProfile(dto);

        var ok = Assert.IsType<OkObjectResult>(result);
        var updated = Assert.IsType<UserProfile>(ok.Value);
        Assert.Equal("New Name", updated.FullName);
        Assert.Equal("new@email.com", updated.Email);
        Assert.Equal(80, updated.BodyWeightKg);
        Assert.Equal("Advanced", updated.FitnessLevel);
        Assert.Equal("Hypertrophy", updated.PrimaryGoal);
        Assert.Equal(5, updated.AvailableDaysPerWeek);

        _repo.Verify(r => r.UpdateAsync(It.Is<UserProfile>(p =>
            p.FullName == "New Name" && p.BodyWeightKg == 80
        )), Times.Once);
    }

    [Fact]
    public async Task UpdateMyProfile_WhenDtoEmailEmpty_KeepsExistingEmail()
    {
        var existing = new UserProfile
        {
            Id    = TestUserId,
            Email = "old@email.com",
        };
        _repo.Setup(r => r.GetByIdAsync(TestUserId)).ReturnsAsync(existing);
        _repo.Setup(r => r.UpdateAsync(It.IsAny<UserProfile>())).Returns(Task.CompletedTask);

        var dto = new UserProfileDto
        {
            FullName = "Keep Email",
            Email    = "",  // rỗng → giữ nguyên email cũ
        };

        var result = await _controller.UpdateMyProfile(dto);

        var ok = Assert.IsType<OkObjectResult>(result);
        var updated = Assert.IsType<UserProfile>(ok.Value);
        Assert.Equal("old@email.com", updated.Email);
    }

    [Fact]
    public async Task UpdateMyProfile_WhenNotExists_ReturnsNotFound()
    {
        _repo.Setup(r => r.GetByIdAsync(TestUserId)).ReturnsAsync((UserProfile)null!);

        var dto = new UserProfileDto { FullName = "Ghost" };
        var result = await _controller.UpdateMyProfile(dto);

        Assert.IsType<NotFoundObjectResult>(result);
        _repo.Verify(r => r.UpdateAsync(It.IsAny<UserProfile>()), Times.Never);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Admin endpoints — GET /api/userprofiles, GET /{id}, DELETE /{id}
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task GetAll_ReturnsOkWithList()
    {
        var profiles = new List<UserProfile>
        {
            new() { Id = "u1", FullName = "User 1" },
            new() { Id = "u2", FullName = "User 2" },
        };
        _repo.Setup(r => r.GetAllAsync()).ReturnsAsync(profiles);

        var result = await _controller.GetAll();

        var ok = Assert.IsType<OkObjectResult>(result);
        var list = Assert.IsAssignableFrom<IEnumerable<UserProfile>>(ok.Value);
        Assert.Equal(2, list.Count());
    }

    [Fact]
    public async Task GetById_WhenFound_ReturnsOk()
    {
        var profile = new UserProfile { Id = "u1", FullName = "Found User" };
        _repo.Setup(r => r.GetByIdAsync("u1")).ReturnsAsync(profile);

        var result = await _controller.GetById("u1");

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal("Found User", ((UserProfile)ok.Value!).FullName);
    }

    [Fact]
    public async Task GetById_WhenNotFound_ReturnsNotFound()
    {
        _repo.Setup(r => r.GetByIdAsync("missing")).ReturnsAsync((UserProfile)null!);

        var result = await _controller.GetById("missing");

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Delete_ReturnsNoContent()
    {
        _repo.Setup(r => r.DeleteAsync("u1")).Returns(Task.CompletedTask);

        var result = await _controller.Delete("u1");

        Assert.IsType<NoContentResult>(result);
        _repo.Verify(r => r.DeleteAsync("u1"), Times.Once);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Kiểm tra attribute [Authorize] trên Controller
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public void Controller_HasAuthorizeAttribute()
    {
        var attrs = typeof(UserProfilesController)
            .GetCustomAttributes(typeof(AuthorizeAttribute), true);

        Assert.Single(attrs);
        var auth = Assert.IsType<AuthorizeAttribute>(attrs[0]);
        // [Authorize] không có Roles → cho tất cả user đã login
        Assert.Null(auth.Roles);
    }

    [Fact]
    public void Controller_HasApiControllerAttribute()
    {
        var attrs = typeof(UserProfilesController)
            .GetCustomAttributes(typeof(ApiControllerAttribute), true);

        Assert.Single(attrs);
    }

    [Fact]
    public void Controller_HasCorrectRoutePrefix()
    {
        var attrs = typeof(UserProfilesController)
            .GetCustomAttributes(typeof(RouteAttribute), true);

        Assert.Single(attrs);
        var route = Assert.IsType<RouteAttribute>(attrs[0]);
        Assert.Equal("api/[controller]", route.Template);
    }
}
