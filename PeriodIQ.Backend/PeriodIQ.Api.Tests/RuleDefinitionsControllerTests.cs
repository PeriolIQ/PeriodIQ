using Microsoft.AspNetCore.Mvc;
using Moq;
using PeriodIQ.Api.Controllers;
using PeriodIQ.Core.Interfaces.Repositories;
using PeriodIQ.Core.Services;
using PeriodIQ.Domain.Entities;

namespace PeriodIQ.Api.Tests;

public class RuleDefinitionsControllerTests
{
    private readonly Mock<IRuleDefinitionRepository> _repo = new();
    private readonly RuleDefinitionsController _controller;

    public RuleDefinitionsControllerTests()
    {
        _controller = new RuleDefinitionsController(new RuleDefinitionService(_repo.Object));
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithList()
    {
        var rules = new List<RuleDefinition>
        {
            new() { Id = "r1", RuleName = "Max Weekly Sets", Category = "VolumeRule", IsActive = true },
            new() { Id = "r2", RuleName = "CNS Conflict", Category = "CnsConflictRule", IsActive = false },
        };
        _repo.Setup(r => r.GetAllAsync()).ReturnsAsync(rules);

        var result = await _controller.GetAll();

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(rules, ok.Value);
    }

    [Fact]
    public async Task GetAll_ReturnsAllActiveAndInactiveRules()
    {
        var rules = new List<RuleDefinition>
        {
            new() { Id = "r1", IsActive = true },
            new() { Id = "r2", IsActive = false },
            new() { Id = "r3", IsActive = true },
        };
        _repo.Setup(r => r.GetAllAsync()).ReturnsAsync(rules);

        var result = await _controller.GetAll();

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(3, ((IEnumerable<RuleDefinition>)ok.Value!).Count());
    }

    [Fact]
    public async Task GetById_WhenFound_ReturnsOk()
    {
        var rule = new RuleDefinition { Id = "r1", RuleName = "Max Weekly Sets", Category = "VolumeRule", IsActive = true };
        _repo.Setup(r => r.GetByIdAsync("r1")).ReturnsAsync(rule);

        var result = await _controller.GetById("r1");

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(rule, ok.Value);
    }

    [Fact]
    public async Task GetById_WhenNotFound_ReturnsNotFound()
    {
        _repo.Setup(r => r.GetByIdAsync("missing")).ReturnsAsync((RuleDefinition)null!);

        var result = await _controller.GetById("missing");

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Create_ReturnsCreatedAtAction()
    {
        var rule = new RuleDefinition { Id = "r3", RuleName = "Progression 2.5%", Category = "ProgressionRule", IsActive = true };
        _repo.Setup(r => r.AddAsync(rule)).Returns(Task.CompletedTask);

        var result = await _controller.Create(rule);

        var created = Assert.IsType<CreatedAtActionResult>(result);
        Assert.Equal(nameof(_controller.GetById), created.ActionName);
        Assert.Equal("r3", created.RouteValues!["id"]);
        Assert.Equal(rule, created.Value);
    }

    [Fact]
    public async Task Update_WhenIdMatches_ReturnsNoContent()
    {
        var rule = new RuleDefinition { Id = "r1", RuleName = "Updated Rule", IsActive = false };
        _repo.Setup(r => r.UpdateAsync(rule)).Returns(Task.CompletedTask);

        var result = await _controller.Update("r1", rule);

        Assert.IsType<NoContentResult>(result);
        _repo.Verify(r => r.UpdateAsync(rule), Times.Once);
    }

    [Fact]
    public async Task Update_WhenIdMismatch_ReturnsBadRequest()
    {
        var rule = new RuleDefinition { Id = "r2", RuleName = "Mismatch" };

        var result = await _controller.Update("r1", rule);

        Assert.IsType<BadRequestObjectResult>(result);
        _repo.Verify(r => r.UpdateAsync(It.IsAny<RuleDefinition>()), Times.Never);
    }

    [Fact]
    public async Task Delete_ReturnsNoContent()
    {
        _repo.Setup(r => r.DeleteAsync("r1")).Returns(Task.CompletedTask);

        var result = await _controller.Delete("r1");

        Assert.IsType<NoContentResult>(result);
        _repo.Verify(r => r.DeleteAsync("r1"), Times.Once);
    }

    [Fact]
    public async Task Toggle_WhenFound_FlipsIsActiveAndReturnsOk()
    {
        var rule = new RuleDefinition { Id = "r1", RuleName = "Volume Rule", IsActive = true };
        _repo.Setup(r => r.GetByIdAsync("r1")).ReturnsAsync(rule);
        _repo.Setup(r => r.UpdateAsync(It.IsAny<RuleDefinition>())).Returns(Task.CompletedTask);

        var result = await _controller.Toggle("r1");

        var ok = Assert.IsType<OkObjectResult>(result);
        _repo.Verify(r => r.UpdateAsync(It.Is<RuleDefinition>(x => x.IsActive == false)), Times.Once);
    }

    [Fact]
    public async Task Toggle_WhenNotFound_ReturnsNotFound()
    {
        _repo.Setup(r => r.GetByIdAsync("missing")).ReturnsAsync((RuleDefinition)null!);

        var result = await _controller.Toggle("missing");

        Assert.IsType<NotFoundResult>(result);
        _repo.Verify(r => r.UpdateAsync(It.IsAny<RuleDefinition>()), Times.Never);
    }
}
